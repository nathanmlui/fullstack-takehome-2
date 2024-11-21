import React, { useState, useEffect, useCallback } from "react";
import classNames from "classnames";
import brotliDecompressModule from "brotli-wasm";

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
  const coinName = "ETH-PERP";
  const coinShortName = coinName.slice(0, 3);
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [brotliDecompress, setBrotliDecompress] = useState<any>(null);

  useEffect(() => {
    brotliDecompressModule.then((module) => {
      setBrotliDecompress(module);
    });
  }, []);

  function isNegative(value: string) {
    return Number(value) < 0;
  }

  const connect = useCallback(() => {
    if (!brotliDecompress) return;

    try {
      const websocket = new WebSocket(
        "wss://wsprod.vest.exchange/ws-api?version=1.0&xwebsocketserver=restserver0"
      );

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
              (t: any) => t?.symbol === coinName
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
      };

      setWs(websocket);
    } catch (error) {
      console.error("Connection error:", error);
    }
  }, [brotliDecompress, coinName]);

  useEffect(() => {
    connect();
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connect]);

  return (
    <section className='coin-info-row'>
      <div className='icon-and-coin-name'>
        <img src='/eth-icon.svg' alt='ETH logo' />
        <h2>{ticker?.symbol || "Loading..."}</h2>
      </div>
      <div>
        <h3>PRICE</h3>
        <p>${ticker?.indexPrice || "-"}</p>
      </div>
      <div>
        <h3>24H CHANGE</h3>
        <p className={isNegative(ticker?.priceChange || "0") ? "red" : "green"}>
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
          {` ${coinShortName}`}
        </p>
      </div>
      <div>
        <h3>SHORT OPEN INTEREST</h3>
        <p className='green'>
          {ticker?.imbalance || "-"}
          {` ${coinShortName}`}
        </p>
      </div>
    </section>
  );
}
