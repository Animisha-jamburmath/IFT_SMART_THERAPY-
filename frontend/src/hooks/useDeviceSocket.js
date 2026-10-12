import { useState, useEffect, useCallback } from 'react';
import wsService from '../services/websocket/client';

export const useDeviceSocket = (messageType, initialData = null) => {
  const [data, setData] = useState(initialData);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!wsService.isConnected()) {
      wsService.connect();
    }

    const interval = setInterval(() => {
      setConnected(wsService.isConnected());
    }, 1000);

    const handleMessage = (message) => setData(message);
    const handleConnection = (status) => setConnected(status.status === 'connected');

    wsService.on(messageType, handleMessage);
    wsService.on('connection', handleConnection);

    return () => {
      clearInterval(interval);
      wsService.off(messageType, handleMessage);
      wsService.off('connection', handleConnection);
    };
  }, [messageType]);

  const sendTherapyParams = useCallback((freq, intensity, session, disease) => {
    return wsService.sendTherapyParams(freq, intensity, session, disease);
  }, []);

  const sendFeedback = useCallback((painBefore, painAfter) => {
    return wsService.sendFeedback(painBefore, painAfter);
  }, []);

  const sendControl = useCallback((key, value) => {
    return wsService.sendControl(key, value);
  }, []);

  return { data, connected, sendTherapyParams, sendFeedback, sendControl };
};