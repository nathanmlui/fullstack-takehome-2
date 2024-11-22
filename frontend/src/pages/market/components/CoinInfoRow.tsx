import React, { useState, useEffect, useCallback, useRef } from "react";
import classNames from "classnames";
import brotliDecompressModule from "brotli-wasm";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const { marketSymbol } = useParams<{ marketSymbol: string }>();
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [brotliDecompress, setBrotliDecompress] = useState<any>(null);
  const marketSelectOptions = ["ETH-PERP", "BTC-PERP"];
  const wsRef = useRef<WebSocket | null>(null);

  // Derive market value from URL parameter
  const currentMarket = (marketSymbol || "").toUpperCase();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const newValue = event.target.value;
    console.log("navigating to", newValue);
    navigate(`/market/${newValue.toLowerCase()}`);
  }

  useEffect(() => {
    brotliDecompressModule.then((module) => {
      setBrotliDecompress(module);
    });
  }, []);

  const connect = useCallback(() => {
    if (!brotliDecompress || !currentMarket) return;

    // Close existing connection if any
    if (wsRef.current) {
      console.log("Closing existing connection for", currentMarket);
      wsRef.current.close();
    }

    try {
      console.log("Creating new WebSocket connection for", currentMarket);
      const websocket = new WebSocket(
        "wss://wsprod.vest.exchange/ws-api?version=1.0&xwebsocketserver=restserver0"
      );

      wsRef.current = websocket;
      setWs(websocket);

      websocket.onopen = () => {
        console.log("Connected to Ticker WebSocket for", currentMarket);
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
            // Only update ticker if it matches current market from URL
            const ticker = parsedData.data.find(
              (t: any) => t?.symbol === currentMarket
            );
            if (ticker) setTicker(ticker);
          }
        } catch (error) {
          console.error("Message processing error:", error);
        }
      };

      websocket.onerror = (error) => {
        console.error("WebSocket error for", currentMarket, error);
        setIsConnected(false);
      };

      websocket.onclose = () => {
        console.log("WebSocket closed for", currentMarket);
        setIsConnected(false);

        if (wsRef.current === websocket) {
          wsRef.current = null;
        }
      };
    } catch (error) {
      console.error("Connection error:", error);
    }
  }, [brotliDecompress, currentMarket]);

  // Connect/reconnect when URL changes
  useEffect(() => {
    // Clear existing ticker when URL changes
    setTicker(null);

    // Establish new connection
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, location.pathname]);

  return (
    <section className='coin-info-row'>
      <div className='icon-and-coin-name'>
        <img src={symbolToImageSource(marketSymbol)} alt='Coin logo' />
        <h2>{currentMarket}</h2>
        <select value={currentMarket} onChange={handleChange}>
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
        <p className={ticker?.priceChange || 1 < 0 ? "red" : "green"}>
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
          {` ${currentMarket.slice(0, 3)}`}
        </p>
      </div>
      <div>
        <h3>SHORT OPEN INTEREST</h3>
        <p className='green'>
          {ticker?.imbalance || "-"}
          {` ${currentMarket.slice(0, 3)}`}
        </p>
      </div>
    </section>
  );
}
