import mqtt from 'mqtt';

const BROKER = import.meta.env.VITE_MQTT_BROKER || 'broker.emqx.io';
const WS_PORT = import.meta.env.VITE_MQTT_WS_PORT || '8083';
const WS_PATH = import.meta.env.VITE_MQTT_PATH || '/mqtt';
const URL = `ws://${BROKER}:${WS_PORT}${WS_PATH}`;

class MQTTService {
  constructor() {
    this.client = null;
    this.subscribers = new Map();
    this.connected = false;
    this.isConnecting = false;
  }

  connect() {
    if (this.isConnecting || this.client) return;
    this.isConnecting = true;
    try {
      this.client = mqtt.connect(URL, {
        clientId: `web_${Math.random().toString(16).slice(2, 10)}`,
        keepalive: 60,
        reconnectPeriod: 5000,
        connectTimeout: 10000,
        clean: true,
        protocolVersion: 4,
      });

      this.client.on('connect', () => {
        console.log('✅ MQTT connected');
        this.connected = true;
        this.isConnecting = false;
        ['ift/telemetry', 'ift/status', 'ift/ai_decision', 'ift/session_record']
          .forEach(t => this.client.subscribe(t));
      });

      this.client.on('message', (topic, msg) => {
        const payload = msg.toString();
        const cbs = this.subscribers.get(topic) || [];
        cbs.forEach(cb => { try { cb(payload); } catch (e) { console.error(e); } });
      });

      this.client.on('error', (err) => { console.error('MQTT error:', err); this.connected = false; this.isConnecting = false; });
      this.client.on('close', () => { this.connected = false; this.isConnecting = false; });
      this.client.on('offline', () => { this.connected = false; this.isConnecting = false; });
    } catch (e) {
      console.error('MQTT connect failed:', e);
      this.isConnecting = false;
    }
  }

  on(topic, callback) {
    if (!this.subscribers.has(topic)) this.subscribers.set(topic, []);
    this.subscribers.get(topic).push(callback);
    if (this.connected) this.client.subscribe(topic);
  }

  off(topic, callback) {
    if (this.subscribers.has(topic)) {
      const arr = this.subscribers.get(topic);
      const idx = arr.indexOf(callback);
      if (idx > -1) arr.splice(idx, 1);
    }
  }

  publish(topic, message) {
    if (!this.connected) return false;
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    this.client.publish(topic, payload);
    console.log(`📤 [${topic}]`, payload);
    return true;
  }

  sendTherapyParams(frequency, intensity, session, disease) {
    return this.publish('ift/therapy_params', {
      frequency, intensity, session, disease: disease || 'General',
    });
  }

  sendFeedback(painBefore, painAfter) {
    return this.publish('ift/feedback', { pain_before: painBefore, pain_after: painAfter });
  }

  sendControl(key, value) {
    const payload = key === 'frequency' ? { frequency_hz: value } :
                    key === 'intensity' ? { intensity_pct: value } : null;
    if (!payload) return false;
    return this.publish('ift/control', payload);
  }

  isConnected() { return this.connected && this.client !== null; }
  disconnect() { if (this.client) { this.client.end(); this.client = null; this.connected = false; } }
}

export default new MQTTService();