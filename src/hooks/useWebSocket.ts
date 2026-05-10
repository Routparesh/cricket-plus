import { useState, useEffect, useRef } from 'react';

export function useWebSocket(matchId: string) {
  const [data, setData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // In production, this would be an environment variable
    const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    
    ws.current = new WebSocket(`${WEBSOCKET_URL}/ws/match/${matchId}`);

    ws.current.onopen = () => {
      console.log(`Connected to live stream for match ${matchId}`);
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setData(payload);
      } catch (e) {
        console.error("Failed to parse websocket message", e);
      }
    };

    ws.current.onclose = () => {
      console.log(`Disconnected from live stream for match ${matchId}`);
      setIsConnected(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [matchId]);

  return { data, isConnected };
}
