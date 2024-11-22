import React, { useState, useEffect, useCallback, useRef } from "react";
import classNames from "classnames";
import brotliDecompressModule from "brotli-wasm";
import { useParams, useNavigate } from "react-router-dom";
import symbolToImageSource from "../../../helpers/symbolToImageSource";

interface Ticker {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  imbalance: string;
  oneHrFundingRate: string;
  cumFunding: string;
  priceChange: string;
  priceChangePercent: string;
  status?: string;
}

export default function CoinInfoRow() {
  const navigate = useNavigate();
  const { marketSymbol } = useParams<{ marketSymbol: string }>();
  const coinShortName = (marketSymbol || "").toUpperCase().slice(0, 3);
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [brotliDecompress, setBrotliDecompress] = useState<any>(null);
  const marketSelectOptions = ["ETH-PERP", "BTC-PERP"];
  const [selectedMarketValue, setSelectedMarketValue] = useState(
    (marketSymbol || "").toUpperCase()
  );
  const wsRef = useRef<WebSocket | null>(null);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    console.log("naving to", event.target.value);
    setSelectedMarketValue(event.target.value);
    navigate(`/market/${event.target.value.toLowerCase()}`);
    // Clear existing ticker data when switching symbols
    setTicker(null);

    // Close existing WebSocket connection and create a new one
    if (wsRef.current) {
      wsRef.current.close();
      setWs(null);
    }
  }

  useEffect(() => {
    brotliDecompressModule.then((module) => {
      setBrotliDecompress(module);
    });
  }, []);

  const connect = useCallback(() => {
    if (!brotliDecompress) return;

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const websocket = new WebSocket(
        "wss://wsprod.vest.exchange/ws-api?version=1.0&xwebsocketserver=restserver0"
      );
      // Store the WebSocket instance in both state and ref
      wsRef.current = websocket;
      setWs(websocket);

      websocket.onopen = () => {
        console.log("Connected to Ticker WebSocket");
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
            params: ["tickers"],
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

          if (
            parsedData.channel === "tickers" &&
            Array.isArray(parsedData.data)
          ) {
            const ticker = parsedData.data.find(
              (t: any) => t?.symbol === selectedMarketValue
            );
            if (ticker) setTicker(ticker);
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
        if (wsRef.current === websocket) {
          wsRef.current = null;
        }
      };

      setWs(websocket);
    } catch (error) {
      console.error("Connection error:", error);
    }
  }, [brotliDecompress, selectedMarketValue]);

  useEffect(() => {
    connect();
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connect, selectedMarketValue]);

  return (
    <section className='coin-info-row'>
      <div className='icon-and-coin-name'>
        <img src={symbolToImageSource(marketSymbol)} alt='Coin logo' />
        {/* <h2>{selectedMarketValue}</h2> */}
        <select value={selectedMarketValue} onChange={handleChange}>
          {marketSelectOptions.map((marketSelectOption) => (
            <option key={marketSelectOption} value={marketSelectOption}>
              {marketSelectOption}
            </option>
          ))}
        </select>
      </div>
      <div>
        <h3>PRICE</h3>
        <p>${ticker?.indexPrice || "-"}</p>
      </div>
      <div>
        <h3>24H CHANGE</h3>
        <p className={Number(ticker?.priceChange) || 0 < 0 ? "red" : "green"}>
          {ticker?.priceChange && ticker?.priceChangePercent
            ? `$${ticker.priceChange} (${ticker.priceChangePercent}%)`
            : "-"}
        </p>
      </div>
      <div>
        <h3>1H HOUR FUNDING</h3>
        <p className='green'>{ticker?.oneHrFundingRate || "-"}</p>
      </div>
      <div>
        <h3>LONG OPEN INTEREST</h3>
        <p className='green'>
          {ticker?.imbalance || "-"}
          {` ${selectedMarketValue.slice(0, 3)}`}
        </p>
      </div>
      <div>
        <h3>SHORT OPEN INTEREST</h3>
        <p className='green'>
          {ticker?.imbalance || "-"}
          {` ${selectedMarketValue.slice(0, 3)}`}
        </p>
      </div>
    </section>
  );
}
