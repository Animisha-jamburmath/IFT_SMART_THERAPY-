import { useState, useEffect } from 'react';
import wsService from '../services/websocket/client';
import { getSessionRecords, createSessionRecord } from '../services/api/sessionRecords';

export const useSessionRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRecord, setLastRecord] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await getSessionRecords();
      setRecords(data);
    } catch (error) {
      console.error('Failed to fetch session records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionRecord = async (message) => {
    try {
      const data = message.data || message;
      console.log('📨 Session record received:', data);
      setLastRecord(data);
      const saved = await createSessionRecord(data);
      console.log('✅ Session record saved:', saved);
      await fetchRecords();
    } catch (error) {
      console.error('Failed to process session record:', error);
    }
  };

  useEffect(() => {
    if (!wsService.isConnected()) {
      wsService.connect();
    }
    wsService.on('session_record', handleSessionRecord);
    fetchRecords();

    return () => {
      wsService.off('session_record', handleSessionRecord);
    };
  }, []);

  return { records, loading, lastRecord, refresh: fetchRecords };
};