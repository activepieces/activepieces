import { useState, useRef, useEffect } from 'react';

type Message = {
  id: number;
  role: 'user' | 'ai';
  text: string;
  time: string;
  streaming?: boolean;
};

const FAKE_RESPONSES = [
  "That's a great question! Let me think about that for you. 🤔",
  'I understand what you mean. Everything depends on context!',
  "Interesting! I'd suggest breaking this down into smaller steps.",
  'Great point! Have you considered looking at it from a different angle?',
  'هذا سؤال رائع! دعني أساعدك في ذلك. 😊',
  'بالتأكيد، يمكنني مساعدتك في هذا الأمر!',
  "I'm not 100% sure, but based on what I know — I'd say yes!",
  "That's fascinating! Tell me more about what you're trying to achieve.",
  "Here's a tip: always start simple and build from there. 🚀",
  'لا تقلق، هذا أمر طبيعي جداً. كلنا نمر بهذه المرحلة!',
  "Great! I think you're on the right track. Keep going! 💪",
  'يبدو أن لديك فكرة رائعة. دعنا نستكشفها معاً!',
];

const getTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const keyframes = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
    40%           { transform: translateY(-5px); opacity: 1; }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  .msg-enter { animation: fadeSlideUp 0.22s ease forwards; }
  .dot-1 { animation: bounce 1.2s infinite 0s; }
  .dot-2 { animation: bounce 1.2s infinite 0.18s; }
  .dot-3 { animation: bounce 1.2s infinite 0.36s; }
  .cursor { display: inline-block; width: 2px; height: 14px; background: currentColor; margin-left: 2px; vertical-align: middle; animation: blink 0.7s infinite; }
  .send-btn:hover { opacity: 0.85; transform: scale(1.05); }
  .send-btn:active { transform: scale(0.96); }
  .send-btn { transition: opacity 0.15s, transform 0.15s; }
  textarea:focus { outline: none; }
  .user-msg-wrap .ts { opacity: 0; transition: opacity 0.15s; }
  .user-msg-wrap:hover .ts { opacity: 1; }
  .msgs-area::-webkit-scrollbar { width: 4px; }
  .msgs-area::-webkit-scrollbar-track { background: transparent; }
  .msgs-area::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
  .dark .msgs-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
  .suggest-chip { background: transparent; border: 1px solid #e5e5e5; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: hsl(var(--foreground)); cursor: pointer; text-align: left; transition: background 0.15s; font-family: inherit; }
  .suggest-chip:hover { background: rgba(0,0,0,0.05); }
  .dark .suggest-chip { border-color: #3f3f46; }
  .dark .suggest-chip:hover { background: rgba(255,255,255,0.07); }
  .prompt-box {
    background: #f5f5f5;
    border: 1px solid #e5e5e5;
  }
  .dark .prompt-box {
    background: #262626;
    border: 1px solid #525252;
  }
  .send-btn-active { background: hsl(var(--primary)); }
  .plus-btn:hover { background: rgba(0,0,0,0.08) !important; }
  .dark .plus-btn:hover { background: rgba(255,255,255,0.08) !important; }
  .prompt-box:focus-within { border-color: #a3a3a3 !important; }
  .dark .prompt-box:focus-within { border-color: #737373 !important; }
  .send-btn-disabled { background: #d4d4d4 !important; }
  .dark .send-btn-disabled { background: #525252 !important; }
  .msgs-fade { background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1)); }
  .dark .msgs-fade { background: linear-gradient(to bottom, rgba(9,9,11,0), rgba(9,9,11,1)); }
`;

export function AIChatBox() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'ai', text: 'Hello! How can I help you today? 👋', time: getTime() },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const streamResponse = (fullText: string) => {
    const words = fullText.split(' ');
    const msgId = Date.now() + 1;
    const time = getTime();

    setMessages((prev) => [
      ...prev,
      { id: msgId, role: 'ai', text: '', time, streaming: true },
    ]);

    let i = 0;
    streamRef.current = setInterval(() => {
      i++;
      const partial = words.slice(0, i).join(' ');
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, text: partial, streaming: i < words.length } : m,
        ),
      );
      if (i >= words.length) {
        clearInterval(streamRef.current!);
        streamRef.current = null;
      }
    }, 60);
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text || typing) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: 'user', text, time: getTime() },
    ]);
    setTyping(true);

    setTimeout(() => {
      const reply = FAKE_RESPONSES[Math.floor(Math.random() * FAKE_RESPONSES.length)];
      setTyping(false);
      streamResponse(reply);
    }, 800 + Math.random() * 600);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  };

  const isStreaming = messages.some((m) => m.streaming);
  const isEmpty = messages.length === 1 && !typing;

  const promptBox = (
    <div style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>
      <div className="prompt-box" style={{
        display: 'flex', flexDirection: 'column',
        borderRadius: '16px', padding: '0',
      }}>
        <textarea
          ref={textareaRef}
          rows={2}
          placeholder="Message AI Builder..."
          value={input}
          onChange={handleInput}
          onKeyDown={handleKey}
          style={{
            width: '100%', background: 'transparent', border: 'none',
            color: 'hsl(var(--foreground))', fontSize: '14px',
            lineHeight: 1.6, resize: 'none', maxHeight: '140px',
            fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
            padding: '12px',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 6px 6px' }}>
          <button
            className="plus-btn"
            style={{
              width: '26px', height: '26px', borderRadius: '50%', border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'hsl(var(--muted-foreground))', transition: 'background 0.15s',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            className={`send-btn ${input.trim() && !typing && !isStreaming ? 'send-btn-active' : 'send-btn-disabled'}`}
            onClick={sendMessage}
            disabled={!input.trim() || typing || isStreaming}
            style={{
              width: '26px', height: '26px', borderRadius: '50%', border: 'none',
              cursor: input.trim() && !typing && !isStreaming ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M12 19V5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 12L12 5L19 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <p style={{ textAlign: 'center', fontSize: '11px', color: '#a3a3a3', margin: '8px 0 0' }}>
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );

  return (
    <>
      <style>{keyframes}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'hsl(var(--background))' }}>

        {isEmpty ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '32px 24px' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>
                How can I help you today?
              </h2>
              <p style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                Ask me anything — I'm here to assist.
              </p>
            </div>
            <div style={{ maxWidth: '720px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                'Summarize a document for me',
                'Help me write an automation flow',
                'What integrations do you support?',
                'How do I connect two apps?',
              ].map((prompt) => (
                <button key={prompt} className="suggest-chip" onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}>
                  {prompt}
                </button>
              ))}
            </div>
            <div style={{ width: '100%' }}>{promptBox}</div>
          </div>
        ) : (
          <>
            <div className="msgs-area" style={{ flex: 1, overflowY: 'auto', padding: '24px 0 0', display: 'flex', flexDirection: 'column' }}>
              <div style={{ maxWidth: '720px', width: '100%', margin: '0 auto', padding: '0 0 40px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {messages.map((msg) =>
                  msg.role === 'ai' ? (
                    <div key={msg.id} className="msg-enter" style={{ padding: '8px 0' }}>
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.65, color: 'hsl(var(--foreground))', whiteSpace: 'pre-wrap' }}>
                        {msg.text}
                        {msg.streaming && <span className="cursor" />}
                      </p>
                    </div>
                  ) : (
                    <div key={msg.id} className="msg-enter user-msg-wrap" style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0' }}>
                      <div style={{ maxWidth: '75%' }}>
                        <div style={{
                          background: 'rgba(120, 120, 120, 0.18)',
                          color: 'hsl(var(--foreground))', padding: '10px 16px',
                          borderRadius: '18px 18px 4px 18px',
                          fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word', overflowWrap: 'break-word',
                        }}>
                          {msg.text}
                        </div>
                        <span className="ts" style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', display: 'block', textAlign: 'right' }}>{msg.time}</span>
                      </div>
                    </div>
                  )
                )}
                {typing && (
                  <div className="msg-enter" style={{ padding: '8px 0' }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <div className="dot-1" style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'hsl(var(--muted-foreground))' }} />
                      <div className="dot-2" style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'hsl(var(--muted-foreground))' }} />
                      <div className="dot-3" style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'hsl(var(--muted-foreground))' }} />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div className="msgs-fade" style={{
                position: 'sticky', bottom: 0, height: '28px', marginTop: '-28px',
                pointerEvents: 'none', flexShrink: 0,
              }} />
            </div>
            <div style={{ padding: '0 24px 10px', flexShrink: 0 }}>
              {promptBox}
            </div>
          </>
        )}
      </div>
    </>
  );
}
