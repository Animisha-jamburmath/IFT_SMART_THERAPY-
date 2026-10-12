/**
 * WebSocket client — replaces MQTT.
 */
class WebSocketService {
  constructor() {
    this.ws = null;
    this.subscribers = new Map();
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectTimer = null;
    this.URL = null;
  }

  getDefaultURL() {
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    return `${protocol}//${host}:8000/ws/client`;
  }

  connect(url = null) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.URL = url || this.getDefaultURL();
    console.log(`🔄 Connecting to WebSocket: ${this.URL}`);

    try {
      this.ws = new WebSocket(this.URL);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.emit('connection', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 WS message:', message);
          if (message.type) {
            this.emit(message.type, message);
          }
          this.emit('*', message);
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.error('❌ WS error:', err);
        this.connected = false;
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket closed');
        this.connected = false;
        this.emit('connection', { status: 'disconnected' });
        this.scheduleReconnect();
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      this.connected = false;
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * this.reconnectAttempts, 5000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(this.URL);
    }, delay);
  }

  on(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType).push(callback);
  }

  off(eventType, callback) {
    if (!this.subscribers.has(eventType)) return;
    const callbacks = this.subscribers.get(eventType);
    const idx = callbacks.indexOf(callback);
    if (idx > -1) callbacks.splice(idx, 1);
  }

  emit(eventType, data) {
    const callbacks = this.subscribers.get(eventType) || [];
    callbacks.forEach(cb => {
      try { cb(data); } catch (err) { console.error('Callback error:', err); }
    });
  }

  send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket not connected');
      return false;
    }
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    this.ws.send(payload);
    console.log('📤 Sent:', payload);
    return true;
  }

  sendTherapyParams(frequency, intensity, session, disease) {
    return this.send({
      type: 'therapy_params',
      frequency,
      intensity,
      session,
      disease: disease || 'General Pain',
      timestamp: Date.now(),
    });
  }

  sendFeedback(painBefore, painAfter) {
    return this.send({
      type: 'feedback',
      pain_before: painBefore,
      pain_after: painAfter,
      timestamp: Date.now(),
    });
  }

  sendControl(key, value) {
    return this.send({
      type: 'control',
      [key]: value,
      timestamp: Date.now(),
    });
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default new WebSocketService();