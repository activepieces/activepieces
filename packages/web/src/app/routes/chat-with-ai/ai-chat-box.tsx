import { useState, useRef, useEffect } from 'react';

type Attachment = {
  name: string;
  type: 'image' | 'document' | 'spreadsheet' | 'code' | 'other';
  src: string; // dataURL for images, empty for files
  size: string;
};

type Message = {
  id: number;
  role: 'user' | 'ai';
  text: string;
  time: string;
  fullDate: string;
  streaming?: boolean;
  images?: string[];
  files?: Attachment[];
};

const FILE_ACCEPT = 'image/*,.pdf,.doc,.docx,.txt,.md,.xlsx,.xls,.csv,.json,.yaml,.yml,.js,.ts,.py';

const getFileType = (name: string): Attachment['type'] => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['png','jpg','jpeg','gif','svg','webp','bmp'].includes(ext)) return 'image';
  if (['pdf','doc','docx','txt','md','rtf'].includes(ext)) return 'document';
  if (['xlsx','xls','csv','tsv'].includes(ext)) return 'spreadsheet';
  if (['json','yaml','yml','js','ts','py','html','css','xml'].includes(ext)) return 'code';
  return 'other';
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const FILE_ICONS: Record<Attachment['type'], string> = {
  image: '🖼️',
  document: '📄',
  spreadsheet: '📊',
  code: '💻',
  other: '📎',
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

const getFullDate = () =>
  new Date().toLocaleString([], { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

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
  .send-btn { transition: opacity 0.15s, transform 0.15s; outline: none; }
  .send-btn:focus-visible { box-shadow: 0 0 0 3px hsl(var(--ring) / 0.5); }
  .plus-btn { outline: none; }
  .plus-btn:focus-visible { box-shadow: 0 0 0 3px hsl(var(--ring) / 0.5); }
  textarea:focus { outline: none; }
  .user-msg-wrap .msg-meta { opacity: 0; transition: opacity 0.15s; }
  .user-msg-wrap:hover .msg-meta { opacity: 1; }
  .msg-action { background: transparent; border: none; cursor: pointer; padding: 2px; border-radius: 4px; color: #a3a3a3; outline: none !important; transition: color 0.15s; position: relative; }
  .msg-action:focus { outline: none !important; }
  .msg-action:hover { color: #404040; }
  .dark .msg-action { color: #a3a3a3; }
  .dark .msg-action:hover { color: #d4d4d4; }
  .msg-tip { position: relative; display: inline-flex; }
  .msg-tip .tip-text { visibility: hidden; opacity: 0; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); margin-top: 4px; padding: 4px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap; background: #262626; color: #e5e5e5; pointer-events: none; transition: opacity 0.15s; z-index: 20; }
  .dark .msg-tip .tip-text { background: #404040; color: #f5f5f5; }
  .msg-tip:hover .tip-text { visibility: visible; opacity: 1; }
  .msgs-area::-webkit-scrollbar { width: 4px; }
  .msgs-area::-webkit-scrollbar-track { background: transparent; }
  .msgs-area::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
  .dark .msgs-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
  .suggest-chip { background: transparent; border: 1px solid #e5e5e5; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: hsl(var(--foreground)); cursor: pointer; text-align: left; transition: background 0.15s; font-family: inherit; outline: none; }
  .suggest-chip:focus-visible { border-color: hsl(var(--ring)); box-shadow: 0 0 0 3px hsl(var(--ring) / 0.5); }
  .suggest-chip:hover { background: rgba(0,0,0,0.05); }
  .dark .suggest-chip { border-color: #3f3f46; }
  .dark .suggest-chip:hover { background: rgba(255,255,255,0.07); }
  .img-preview-wrap img { border: 1px solid #e5e5e5 !important; }
  .dark .img-preview-wrap img { border-color: #404040 !important; }
  .img-preview-wrap { position: relative; display: inline-block; }
  .img-preview-wrap .img-remove { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: #525252; color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px; line-height: 1; opacity: 0; transition: opacity 0.15s; outline: none; }
  .img-preview-wrap:hover .img-remove { opacity: 1; }
  .file-chip { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; background: rgba(120,120,120,0.1); border: 1px solid #e5e5e5; font-family: inherit; max-width: 200px; }
  .dark .file-chip { border-color: #404040; background: rgba(255,255,255,0.06); }
  .file-chip-pending { position: relative; }
  .file-chip-pending .img-remove { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: #525252; color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px; line-height: 1; opacity: 0; transition: opacity 0.15s; outline: none; }
  .file-chip-pending:hover .img-remove { opacity: 1; }
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
  .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 100; cursor: default; animation: fadeIn 0.15s ease; }
  .lightbox img { max-width: 90vw; max-height: 90vh; border-radius: 8px; object-fit: contain; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .chat-img { cursor: pointer; transition: opacity 0.15s; border: 1px solid #e5e5e5; }
  .dark .chat-img { border-color: #404040; }
  .chat-img:hover { opacity: 0.85; }
  .drop-overlay { position: absolute; top: 0; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 700px; z-index: 50; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.85); pointer-events: none; }
  .dark .drop-overlay { background: rgba(9,9,11,0.85); }
  .msgs-fade { background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1)); }
  .dark .msgs-fade { background: linear-gradient(to bottom, rgba(9,9,11,0), rgba(9,9,11,1)); }
`;

export function AIChatBox({ onFirstMessage }: { onFirstMessage?: (text: string) => void }) {
  const hasCalledFirstMessage = useRef(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!lightboxSrc) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxSrc(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxSrc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const streamResponse = (fullText: string) => {
    const words = fullText.split(' ');
    const msgId = Date.now() + 1;
    const time = getTime();

    setMessages((prev) => [
      ...prev,
      { id: msgId, role: 'ai', text: '', time, fullDate: getFullDate(), streaming: true },
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPendingImages((prev) => [...prev, ev.target?.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        const attachment: Attachment = {
          name: file.name,
          type: getFileType(file.name),
          src: '',
          size: formatSize(file.size),
        };
        setPendingFiles((prev) => [...prev, attachment]);
      }
    });
    e.target.value = '';
  };

  const removePendingImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPendingImages((prev) => [...prev, ev.target?.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        const attachment: Attachment = {
          name: file.name,
          type: getFileType(file.name),
          src: '',
          size: formatSize(file.size),
        };
        setPendingFiles((prev) => [...prev, attachment]);
      }
    });
  };

  const sendMessage = () => {
    const text = input.trim();
    const hasAttachments = pendingImages.length > 0 || pendingFiles.length > 0;
    if ((!text && !hasAttachments) || typing) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    const images = pendingImages.length > 0 ? [...pendingImages] : undefined;
    const files = pendingFiles.length > 0 ? [...pendingFiles] : undefined;
    setPendingImages([]);
    setPendingFiles([]);

    if (!hasCalledFirstMessage.current) {
      hasCalledFirstMessage.current = true;
      onFirstMessage?.(text || (files ? files[0].name : 'Image attachment'));
    }

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: 'user', text, time: getTime(), fullDate: getFullDate(), images, files },
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

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPendingImages((prev) => [...prev, ev.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  };

  const isStreaming = messages.some((m) => m.streaming);
  const isEmpty = messages.length === 0 && !typing;

  const promptBox = (
    <div style={{ maxWidth: '560px', margin: '0 auto', width: '100%' }}>
      <div className="prompt-box" style={{
        display: 'flex', flexDirection: 'column',
        borderRadius: '16px', padding: '0',
      }}>
        <input ref={fileInputRef} type="file" accept={FILE_ACCEPT} multiple hidden onChange={handleFileSelect} />
        {(pendingImages.length > 0 || pendingFiles.length > 0) && (
          <div style={{ display: 'flex', gap: '8px', padding: '12px 12px 0', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {pendingImages.map((src, i) => (
              <div key={'img-' + i} className="img-preview-wrap" style={{ display: 'flex' }}>
                <img src={src} alt="" style={{ height: '52px', borderRadius: '8px', objectFit: 'cover', display: 'block', border: '1px solid #e5e5e5' }} />
                <button className="img-remove" onClick={() => removePendingImage(i)}>×</button>
              </div>
            ))}
            {pendingFiles.map((file, i) => (
              <div key={'file-' + i} className="file-chip-pending">
                <div className="file-chip">
                  <span style={{ fontSize: '20px' }}>{FILE_ICONS[file.type]}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'hsl(var(--foreground))' }}>{file.name}</div>
                    <div style={{ fontSize: '10px', color: '#a3a3a3' }}>{file.size}</div>
                  </div>
                </div>
                <button className="img-remove" onClick={() => removePendingFile(i)}>×</button>
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          rows={2}
          placeholder="Message AI Piecer..."
          value={input}
          onChange={handleInput}
          onKeyDown={handleKey}
          onPaste={handlePaste}
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
            onClick={() => fileInputRef.current?.click()}
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
            className={`send-btn ${(input.trim() || pendingImages.length > 0 || pendingFiles.length > 0) && !typing && !isStreaming ? 'send-btn-active' : 'send-btn-disabled'}`}
            onClick={sendMessage}
            disabled={(!input.trim() && pendingImages.length === 0 && pendingFiles.length === 0) || typing || isStreaming}
            style={{
              width: '26px', height: '26px', borderRadius: '50%', border: 'none',
              cursor: (input.trim() || pendingImages.length > 0 || pendingFiles.length > 0) && !typing && !isStreaming ? 'pointer' : 'default',
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
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', background: 'hsl(var(--background))' }}
      >

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
            <div style={{ maxWidth: '560px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
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
              <div style={{ maxWidth: '560px', width: '100%', margin: '0 auto', padding: '0 0 40px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                        {msg.images && msg.images.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: msg.text ? '6px' : 0, justifyContent: 'flex-end' }}>
                            {msg.images.map((src, i) => (
                              <img key={i} src={src} alt="" className="chat-img" onClick={() => setLightboxSrc(src)} style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '12px', objectFit: 'cover', display: 'block' }} />
                            ))}
                          </div>
                        )}
                        {msg.files && msg.files.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: msg.text ? '6px' : 0, justifyContent: 'flex-end' }}>
                            {msg.files.map((file, i) => (
                              <div key={i} className="file-chip">
                                <span style={{ fontSize: '18px' }}>{FILE_ICONS[file.type]}</span>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'hsl(var(--foreground))' }}>{file.name}</div>
                                  <div style={{ fontSize: '10px', color: '#a3a3a3' }}>{file.size}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.text && (
                          <div style={{
                            background: 'rgba(120, 120, 120, 0.18)',
                            color: 'hsl(var(--foreground))', padding: '10px 16px',
                            borderRadius: '18px 18px 4px 18px',
                            fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word', overflowWrap: 'break-word',
                          }}>
                            {msg.text}
                          </div>
                        )}
                        <div className="msg-meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                          <span className="msg-tip">
                            <span style={{ fontSize: '12px', color: '#a3a3a3' }}>{msg.time}</span>
                            <span className="tip-text">{msg.fullDate}</span>
                          </span>
                          {msg.text && (
                            <>
                              <span className="msg-tip">
                                <button className="msg-action" onClick={() => { navigator.clipboard.writeText(msg.text); setCopiedId(msg.id); setTimeout(() => setCopiedId(null), 1500); }}>
                                  {copiedId === msg.id ? (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  ) : (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                  )}
                                </button>
                                <span className="tip-text">{copiedId === msg.id ? 'Copied!' : 'Copy'}</span>
                              </span>
                              <span className="msg-tip">
                                <button className="msg-action" onClick={() => { setInput(msg.text); textareaRef.current?.focus(); }}>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="3" x2="21" y1="6" y2="6"/>
                                    <path d="M3 12h15a3 3 0 1 1 0 6h-4"/>
                                    <polyline points="16 16 14 18 16 20"/>
                                    <line x1="3" x2="10" y1="18" y2="18"/>
                                  </svg>
                                </button>
                                <span className="tip-text">Add to prompt</span>
                              </span>
                            </>
                          )}
                        </div>
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
        {isDragging && (
          <div className="drop-overlay">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>Add anything</span>
              <span style={{ fontSize: '14px', color: 'hsl(var(--foreground))' }}>Drop any file here to add it to the conversation</span>
            </div>
          </div>
        )}
      </div>
      {lightboxSrc && (
        <div className="lightbox" onClick={() => setLightboxSrc(null)}>
          <button
            onClick={() => setLightboxSrc(null)}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <img src={lightboxSrc} alt="" onClick={(e) => e.stopPropagation()} style={{ cursor: 'default' }} />
        </div>
      )}
    </>
  );
}
