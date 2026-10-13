import { useState, useEffect } from 'react';
import mqttService from '../services/mqtt/client';
import { getSessionRecords, createSessionRecord } from '../services/api/sessionRecords';

export const useSessionRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRecord, setLastRecord] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try { setRecords(await getSessionRecords()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleMQTT = async (payload) => {
    try {
      const data = JSON.parse(payload);
      setLastRecord(data);
      await createSessionRecord(data);
      await fetchRecords();
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!mqttService.isConnected()) mqttService.connect();
    mqttService.on('ift/session_record', handleMQTT);
    fetchRecords();
  }, []);

  return { records, loading, lastRecord, refresh: fetchRecords };
};