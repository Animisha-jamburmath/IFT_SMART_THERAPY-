import { useState, useEffect, useCallback } from 'react';
import mqttService from '../services/mqtt/client';

export const useMQTT = (topic, initialData = null) => {
  const [data, setData] = useState(initialData);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!mqttService.isConnected()) mqttService.connect();
    const interval = setInterval(() => setConnected(mqttService.isConnected()), 1000);
    const handleMsg = (payload) => {
      try { setData(JSON.parse(payload)); } catch { setData(payload); }
    };
    mqttService.on(topic, handleMsg);
    return () => clearInterval(interval);
  }, [topic]);

  const publish = useCallback((msg) => mqttService.publish(topic, msg), [topic]);
  const sendTherapyParams = useCallback((f, i, s, d) => mqttService.sendTherapyParams(f, i, s, d), []);
  const sendFeedback = useCallback((b, a) => mqttService.sendFeedback(b, a), []);
  const sendControl = useCallback((k, v) => mqttService.sendControl(k, v), []);

  return { data, connected, publish, sendTherapyParams, sendFeedback, sendControl };
};