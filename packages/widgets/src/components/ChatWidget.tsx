import React, { useState, useRef, useEffect } from 'react';
import showdown from 'showdown';

import './ChatWidget.css';

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

export const defaultTheme: ThemeOptions = {
  headerColor: '#333',
  headerTextColor: '#fff',
  backgroundColor: '#fff',
  userMessageColor: '#ccc',
  userMessageTextColor: '#333',
  botMessageColor: '#333',
  botMessageTextColor: '#fff',
  buttonColor: '#333',
  buttonTextColor: '#fff',
  inputBorderColor: '#ccc',
};

export interface ChatWidgetProps {
  webhookUrl: string;
  title?: string;
  welcomeMessage?: string;
  theme?: ThemeOptions;
  icon?: string | React.ReactNode;
}

const DEFAULT_WELCOME_MSG = '👋 Hi there! How can I help you today?';
const DEFAULT_TITLE = 'Chat';

const getOrCreateSessionId = () => {
  const key = 'ax_chat_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
};

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  webhookUrl,
  title,
  welcomeMessage = DEFAULT_WELCOME_MSG,
  theme: userTheme = {},
  icon,
}) => {
  const [messages, setMessages] = useState([
    { from: 'bot', text: welcomeMessage },
  ]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(true);
  const [loading, setLoading] = useState(false);

  const sessionIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const converter = new showdown.Converter({
    tables: true,
    simpleLineBreaks: true,
    simplifiedAutoLink: true,
    openLinksInNewWindow: true,
    omitExtraWLInCodeBlocks: true,
  });

  const adjustTextAreaHeight = () => {
    const textArea = textAreaRef.current;
    if (textArea) {
      textArea.style.height = 'auto'; // Reset height before adjusting
      textArea.style.height = `${textArea.scrollHeight}px`; // Set height based on content
    }
  };

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
  }, []);

  // Automatically scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Adjust height on input change
  useEffect(() => {
    adjustTextAreaHeight();
  }, [input]);

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
        body: JSON.stringify({
          message: text,
          sessionId: sessionIdRef.current,
        }),
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

  // Fill in missing theme options with default ones
  const theme = { ...defaultTheme, ...userTheme };

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
        {icon &&
          (typeof icon === 'string' ? (
            <img
              src={icon}
              alt="Chat icon"
              className="ax-chat-icon"
              style={{ width: 24, height: 24 }}
            />
          ) : (
            <span className="ax-chat-icon">{icon}</span>
          ))}
        {title
          ? title
          : icon
          ? null
          : DEFAULT_TITLE && (
              <span className="ax-chat-title">{title ?? DEFAULT_TITLE}</span>
            )}
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
                <div
                  dangerouslySetInnerHTML={{
                    __html: converter.makeHtml(msg.text),
                  }}
                ></div>
              </div>
            ))}
            {loading && <div className="ax-message ax-bot">...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="ax-chat-footer">
            <textarea
              ref={textAreaRef}
              placeholder="Type a message..."
              value={input}
              style={inputStyle}
              onChange={(e) => {
                setInput(e.target.value);
              }}
              onKeyDown={(e) => {
                // Submit on Enter WITHOUT Shift
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              rows={1}
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
