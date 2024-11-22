import React, { useEffect, useRef, useState, useCallback } from "react";
import { ColorType, createChart, IChartApi } from "lightweight-charts";
import brotliDecompressModule from "brotli-wasm";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useParams, useLocation } from "react-router-dom";

dayjs.extend(utc);

type KLineData = {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
};

export function EmojiBar() {
  const emojis = ["🚀", "😍", "😭", "😱", "👎🏼"];
  return (
    <div className='emoji-bar'>
      {emojis.map((emoji, index) => (
        <span className='emoji' key={index}>
          {emoji}
        </span>
      ))}
    </div>
  );
}

export default function CoinChart() {
  const [isConnected, setIsConnected] = useState(false);
  const [brotliDecompress, setBrotliDecompress] = useState<any>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const { marketSymbol } = useParams<{ marketSymbol: string }>();
  const symbol = marketSymbol?.toUpperCase();
  const [klineData, setKlineData] = useState<any[]>([]);
  const location = useLocation();
  const interval = "1m";
  const channelName = `${symbol}@kline_${interval}`;

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const formatKLineData = useCallback((data: any | any[]) => {
    const formatSingle = (kline: any) => ({
      time: Math.floor(Number(kline[0]) / 1000),
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
    });

    return Array.isArray(data[0]) ? data.map(formatSingle) : formatSingle(data);
  }, []);

  // Initialize Brotli once
  useEffect(() => {
    let mounted = true;
    brotliDecompressModule.then((module) => {
      if (mounted) {
        setBrotliDecompress(module);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch initial data when symbol changes
  useEffect(() => {
    if (!symbol) return;

    console.log("Fetching initial data for", symbol);
    setKlineData([]);

    fetch(`https://serverprod.vest.exchange/v2/klines?symbol=${symbol}`, {
      headers: {
        xrestservermm: "restserver0",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("KLINES fetch for", symbol, data);
        setKlineData(data);
      })
      .catch((error) => console.error("Failed to fetch klines:", error));
  }, [symbol]);

  // Initialize chart with ResizeObserver
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const parent = container.parentElement;

    if (!parent) return;

    // Create chart
    const chart = createChart(container, {
      width: parent.clientWidth,
      height: parent.clientHeight,
      layout: {
        textColor: "white",
        background: { type: ColorType.Solid, color: "#161514" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
      grid: {
        vertLines: {
          color: "#424242",
        },
        horzLines: {
          color: "#424242",
        },
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    // Set initial data if available
    if (klineData.length > 0) {
      const formattedData = formatKLineData(klineData);
      candlestickSeriesRef.current.setData(formattedData);
      chart.timeScale().fitContent();
    }

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      // Get the new parent dimensions
      const width = parent.clientWidth;
      const height = parent.clientHeight;

      // Update container size to match parent
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;

      // Resize chart
      chart.resize(width, height);
      chart.timeScale().fitContent();
    });

    // Start observing
    resizeObserver.observe(parent);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [symbol, formatKLineData]);

  // Update chart data when klineData changes
  useEffect(() => {
    if (!candlestickSeriesRef.current || !klineData.length) return;

    console.log("Updating chart data for", symbol);
    const formattedData = formatKLineData(klineData);
    candlestickSeriesRef.current.setData(formattedData);
    chartRef.current?.timeScale().fitContent();
  }, [klineData, formatKLineData, symbol]);

  // WebSocket connection code remains the same...
  const connect = useCallback(() => {
    if (!brotliDecompress) return;

    if (wsRef.current) {
      console.log("Closing existing WebSocket for", symbol);
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      console.log("Creating new WebSocket connection for", symbol);
      const websocket = new WebSocket(
        "wss://wsprod.vest.exchange/ws-api?version=1.0&xwebsocketserver=restserver0"
      );
      wsRef.current = websocket;
      setWs(websocket);

      websocket.onopen = () => {
        console.log("Connected to KLine WebSocket for", symbol);
        setIsConnected(true);

        websocket.send(
          JSON.stringify({
            method: "PING",
            params: [],
            id: 0,
          })
        );

        websocket.send(
          JSON.stringify({
            method: "SUBSCRIBE",
            params: [channelName],
            id: 1,
          })
        );
      };

      websocket.onmessage = async (event) => {
        try {
          let decodedData;
          if (event.data instanceof Blob) {
            const arrayBuffer = await event.data.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            if (uint8Array[0] === 0x1b && uint8Array[1] === 0x9c) {
              const decompressed = brotliDecompress.decompress(uint8Array);
              decodedData = new TextDecoder().decode(decompressed);
            } else {
              decodedData = new TextDecoder().decode(uint8Array);
            }
          } else {
            decodedData = event.data;
          }

          const parsedData = JSON.parse(decodedData);

          if (parsedData.data === "PONG") {
            console.log("PONG received for", symbol);
            return;
          }

          if (parsedData.channel === channelName) {
            console.log("New kline message for", symbol, parsedData.data);
            const update = formatKLineData(parsedData.data);
            if (candlestickSeriesRef.current) {
              candlestickSeriesRef.current.update(update);
            }
          }
        } catch (error) {
          console.error("Message processing error:", error);
        }
      };

      websocket.onerror = (error) => {
        console.error("WebSocket error for", symbol, error);
        setIsConnected(false);
      };

      websocket.onclose = () => {
        console.log("WebSocket closed for", symbol);
        setIsConnected(false);
        if (wsRef.current === websocket) {
          wsRef.current = null;
        }
      };
    } catch (error) {
      console.error("Connection error:", error);
    }
  }, [brotliDecompress, symbol, channelName]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, location.pathname]);

  return (
    <div className='coin-chart'>
      <div className='coin-chart-container-ref' ref={chartContainerRef} />
      <EmojiBar />
    </div>
  );
}
