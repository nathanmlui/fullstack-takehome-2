import React, { useEffect, useRef, useState, useCallback } from "react";
import { ColorType, createChart, IChartApi } from "lightweight-charts";
import brotliDecompressModule from "brotli-wasm";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useParams } from "react-router-dom";

dayjs.extend(utc);

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
  const interval = "1m";
  const channelName = `${symbol}@kline_${interval}`;

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);

  const formatKLineData = useCallback((data: any | any[]) => {
    const formatSingle = (kline: any) => ({
      time: Math.floor(Number(kline[0]) / 1000), //Convert epoch to UTC timestamp
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
    });

    // KLines response from WS is a single array of values, but REST response is an array of arrays
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

  // Fetch initial data once
  useEffect(() => {
    fetch(`https://serverprod.vest.exchange/v2/klines?symbol=${symbol}`, {
      headers: {
        xrestservermm: "restserver0",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("KLINES fetch", data);
        setKlineData(data);
      })
      .catch((error) => console.error("Failed to fetch klines:", error));
  }, []); // Only fetch once on mount

  // Initialize chart once
  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return;

    const chartOptions = {
      autosize: true,
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
    };

    chartRef.current = createChart(chartContainerRef.current, chartOptions);
    candlestickSeriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  // Update chart data when klineData changes
  useEffect(() => {
    if (!candlestickSeriesRef.current || !klineData.length) return;

    const formattedData = formatKLineData(klineData);
    candlestickSeriesRef.current.setData(formattedData);
    chartRef.current?.timeScale().fitContent();
  }, [klineData]);

  // WebSocket connection
  const connect = useCallback(() => {
    if (!brotliDecompress) return;

    try {
      const websocket = new WebSocket(
        "wss://wsprod.vest.exchange/ws-api?version=1.0&xwebsocketserver=restserver0"
      );

      websocket.onopen = () => {
        console.log("Connected to KLine WebSocket");
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
            console.log("PONG received");
            return;
          }

          // Handle new kline data
          if (parsedData.channel === channelName) {
            console.log("new kline message", parsedData.data);
            const update = formatKLineData(parsedData.data);
            console.log("updating with", update);
            candlestickSeriesRef.current.update(update);
          }
        } catch (error) {
          console.error("Message processing error:", error);
        }
      };

      websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };

      websocket.onclose = () => {
        console.log("WebSocket closed");
        setIsConnected(false);
      };

      setWs(websocket);
    } catch (error) {
      console.error("Connection error:", error);
    }
  }, [brotliDecompress, channelName]);

  // Connect WebSocket once when ready
  useEffect(() => {
    if (brotliDecompress && !ws) {
      connect();
    }
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [brotliDecompress, connect, ws]);

  return (
    <div className='coin-chart'>
      <div ref={chartContainerRef} style={{ width: "100%", height: "500px" }} />
      <EmojiBar />
    </div>
  );
}
