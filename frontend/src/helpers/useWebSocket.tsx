import { useState, useEffect, useCallback } from "react";
import brotliDecompressModule from "brotli-wasm";

interface WebSocketConfig {
  url: string;
  onMessage: (parsedData: any) => void;
  subscriptions: {
    method: string;
    params: string[];
    id: number;
  }[];
}

export function useWebSocket({
  url,
  onMessage,
  subscriptions,
}: WebSocketConfig) {
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [brotliDecompress, setBrotliDecompress] = useState<any>(null);

  // Initialize Brotli
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

  const connect = useCallback(() => {
    if (!brotliDecompress) return;

    try {
      const websocket = new WebSocket(url);

      websocket.onopen = () => {
        console.log("Connected to WebSocket");
        setIsConnected(true);

        // Send all subscriptions
        subscriptions.forEach((subscription) => {
          websocket.send(JSON.stringify(subscription));
        });
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

          onMessage(parsedData);
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
  }, [brotliDecompress, url, subscriptions, onMessage]);

  useEffect(() => {
    if (brotliDecompress) {
      connect();
    }
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [brotliDecompress, connect]);

  return { isConnected, ws };
}
