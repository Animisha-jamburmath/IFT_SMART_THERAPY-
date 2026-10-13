import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { FiSend, FiMic, FiMicOff } from 'react-icons/fi';
import { FaRobot, FaUserCircle } from 'react-icons/fa';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Hello! I am your AI therapy coach. Ask me anything about pain management, IFT, or rehabilitation.' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userMsg = { id: Date.now(), sender: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: inputText, language: 'en' }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: data.response || 'No response.' }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: 'Error connecting to AI service.' }]);
    }
    setIsThinking(false);
  };

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window)) { alert('Voice input not supported.'); return; }
    if (isListening) { setIsListening(false); return; }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      setInputText(event.results[0][0].transcript);
      setIsListening(false);
      setTimeout(handleSend, 200);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar /><div className="flex-1 flex flex-col">
        <Topbar title="AI Coach" />
        <main className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-soft p-4 mb-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-3 mb-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${msg.sender === 'user' ? 'bg-gradient-to-r from-primary to-blue-600 text-white' : 'bg-gradient-to-r from-purple-100 to-blue-100 text-primary'}`}>
                  {msg.sender === 'user' ? <FaUserCircle size={20} /> : <FaRobot size={20} />}
                </div>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-gradient-to-r from-primary to-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-100 to-blue-100 flex items-center justify-center"><FaRobot className="text-primary" /></div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-none"><div className="flex items-center gap-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div></div></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-3 flex items-end gap-3">
            <button onClick={toggleListening} className={`p-3 rounded-xl transition ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {isListening ? <FiMicOff size={20} /> : <FiMic size={20} />}
            </button>
            <input type="text" placeholder="Ask about your therapy..." value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary bg-gray-50" />
            <button onClick={handleSend} disabled={!inputText.trim()} className={`p-3 rounded-xl ${inputText.trim() ? 'bg-gradient-to-r from-primary to-blue-600 text-white hover:shadow-lg' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
              <FiSend size={20} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AIAssistant;