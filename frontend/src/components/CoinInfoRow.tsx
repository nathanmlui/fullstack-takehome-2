import React, { useState, useEffect, useCallback } from "react";
import classNames from "classnames";

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
  const coinName = "ETH-PERP"; // This will be set dynamically eg. via props or URL params
  const coinShortName = coinName.slice(0, 3);
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [ws, setWs] = useState<WebSocket | null>(null);

  function isNegative(value: string) {
    return Number(value) < 0;
  }

  const connect = useCallback(() => {
    const websocket = new WebSocket(
      "wss://wsprod.vest.exchange/ws-api?version=1.0&xwebsocketserver=restserver0"
    );

    websocket.onopen = () => {
      console.log("Connected to WebSocket");
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
        const rawData =
          event.data instanceof Blob ? await event.data.text() : event.data;
        const parsedData = JSON.parse(rawData);

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
          console.log("ticker", ticker);
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
  }, [coinName]);

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
        <p
          className={classNames({
            red: isNegative(ticker?.priceChange || "0"),
          })}
        >
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
