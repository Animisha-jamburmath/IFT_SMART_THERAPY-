import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { FiSend, FiMic, FiMicOff, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { FaRobot, FaUserCircle } from 'react-icons/fa';

const AIAssistant = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([{ id: 1, sender: 'ai', text: t('aiCoach.welcome') }]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const msgText = input;
    setInput('');
    setThinking(true);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: msgText,
          language: 'en',
          history: messages.slice(-6).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now()+1, sender: 'ai', text: data.response || 'No response.' }]);
      speak(data.response);
    } catch {
      setMessages(prev => [...prev, { id: Date.now()+1, sender: 'ai', text: t('aiCoach.error') }]);
    } finally { setThinking(false); }
  };

  const toggleListen = () => {
    if (!('webkitSpeechRecognition' in window)) { alert('Voice not supported'); return; }
    if (listening) { setListening(false); return; }
    const rec = new window.webkitSpeechRecognition();
    rec.lang = 'en-US';
    rec.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false); setTimeout(send, 300); };
    rec.onerror = () => setListening(false);
    rec.start();
    setListening(true);
  };

  const speak = (text) => {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.95;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const toggleSpeak = () => {
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); }
    else {
      const last = [...messages].reverse().find(m => m.sender === 'ai');
      if (last) speak(last.text);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('aiCoach.title')} />
        <main className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-soft border p-4 mb-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex items-start gap-3 mb-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  msg.sender === 'user' ? 'bg-gradient-to-r from-primary to-blue-600 text-white' : 'bg-gradient-to-r from-purple-100 to-blue-100 text-primary'
                }`}>
                  {msg.sender === 'user' ? <FaUserCircle size={20} /> : <FaRobot size={20} />}
                </div>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl whitespace-pre-wrap ${
                  msg.sender === 'user' ? 'bg-gradient-to-r from-primary to-blue-600 text-white rounded-br-none' : 'bg-gray-100 rounded-bl-none'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            {thinking && <div className="flex items-start gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-100 to-blue-100 flex items-center justify-center"><FaRobot className="text-primary" /></div><div className="bg-gray-100 px-4 py-3 rounded-2xl"><div className="flex gap-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div></div></div></div>}
            <div ref={endRef} />
          </div>

          <div className="bg-white rounded-2xl shadow-soft border p-3 flex items-end gap-3">
            <button onClick={toggleListen} className={`p-3 rounded-xl ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100'}`}>
              {listening ? <FiMicOff size={20} /> : <FiMic size={20} />}
            </button>
            <button onClick={toggleSpeak} className={`p-3 rounded-xl ${speaking ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
              {speaking ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={t('aiCoach.placeholder')}
              className="flex-1 px-4 py-2.5 border rounded-xl bg-gray-50"
            />
            <button onClick={send} disabled={!input.trim()} className={`p-3 rounded-xl ${input.trim() ? 'bg-gradient-to-r from-primary to-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
              <FiSend size={20} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AIAssistant;