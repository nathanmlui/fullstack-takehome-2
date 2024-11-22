// In progress
import { useEffect, useRef, useState, useCallback } from "react";
interface WebSocketConfig {
  url: string;
  onMessage: (data: any) => void;
  subscriptions: any[];
}

export function useWebSocket({
  url,
  onMessage,
  subscriptions,
}: WebSocketConfig) {
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [brotliDecompress, setBrotliDecompress] = useState<any>(null);

  // Store subscriptions in a ref to prevent reconnections
  const subscriptionsRef = useRef(subscriptions);
  const onMessageRef = useRef(onMessage);

  // Update refs when props change
  useEffect(() => {
    subscriptionsRef.current = subscriptions;
    onMessageRef.current = onMessage;
  }, [subscriptions, onMessage]);

  const connect = useCallback(() => {
    if (!brotliDecompress) return;

    try {
      const websocket = new WebSocket(url);

      websocket.onopen = () => {
        console.log("Connected to WebSocket");
        setIsConnected(true);

        // Use ref value for subscriptions
        subscriptionsRef.current.forEach((subscription) => {
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

          // Use ref value for onMessage
          onMessageRef.current(parsedData);
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
  }, [brotliDecompress, url]); // Removed subscriptions and onMessage dependencies

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
