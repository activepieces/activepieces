import React, { useState, useRef, useEffect } from 'react';
import './ChatWindow.css';

export interface ThemeOptions {
  headerColor?: string;
  headerTextColor?: string;
  backgroundColor?: string;
  userMessageColor?: string;
  userMessageTextColor?: string;
  botMessageColor?: string;
  botMessageTextColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  inputBorderColor?: string;
}

export interface ChatWindowProps {
  webhookUrl: string;
  title?: string;
  welcomeMessage?: string;
  theme?: ThemeOptions;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  webhookUrl,
  title,
  welcomeMessage,
  theme = {},
}) => {
  const [messages, setMessages] = useState([
    { from: 'bot', text: welcomeMessage },
  ]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(true);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Automatically scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    setMessages((msgs) => [...msgs, { from: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) throw new Error('Network error');

      const reply = await res.text();

      setMessages((msgs) => [...msgs, { from: 'bot', text: reply }]);
    } catch (err) {
      console.error(err);
      setMessages((msgs) => [
        ...msgs,
        { from: 'bot', text: '⚠️ Sorry, something went wrong.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const headerStyle = {
    backgroundColor: theme.headerColor,
    color: theme.headerTextColor,
  };

  const bodyStyle = {
    backgroundColor: theme.backgroundColor,
  };

  const buttonStyle = {
    backgroundColor: theme.buttonColor,
    color: theme.buttonTextColor,
  };

  const inputStyle = {
    borderColor: theme.inputBorderColor,
  };

  const userMessageStyle = {
    backgroundColor: theme.userMessageColor,
    color: theme.userMessageTextColor,
  };

  const botMessageStyle = {
    backgroundColor: theme.botMessageColor,
    color: theme.botMessageTextColor,
  };

  return (
    <div
      className={`ax-chat-container ${isMinimized ? 'ax-minimized' : ''}`}
      style={bodyStyle}
    >
      <div
        className="ax-chat-header"
        style={headerStyle}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <span className="ax-chat-title">{title}</span>
        {!isMinimized && <span className="ax-minimize-indicator">x</span>}
      </div>

      {!isMinimized && (
        <>
          <div className="ax-chat-body">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`ax-message ${
                  msg.from === 'user' ? 'ax-user' : 'ax-bot'
                }`}
                style={msg.from === 'user' ? userMessageStyle : botMessageStyle}
              >
                {msg.text}
              </div>
            ))}
            {loading && <div className="ax-message ax-bot">...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="ax-chat-footer">
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              style={inputStyle}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              style={buttonStyle}
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
};
