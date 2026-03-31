import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

import dropMediaImg from '@/assets/img/drop-media.svg';

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
  quotes?: { text: string; msgId: number }[];
};

const FILE_ACCEPT =
  'image/*,.pdf,.doc,.docx,.txt,.md,.xlsx,.xls,.csv,.json,.yaml,.yml,.js,.ts,.py';

const getFileType = (name: string): Attachment['type'] => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'].includes(ext))
    return 'image';
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'].includes(ext))
    return 'document';
  if (['xlsx', 'xls', 'csv', 'tsv'].includes(ext)) return 'spreadsheet';
  if (
    ['json', 'yaml', 'yml', 'js', 'ts', 'py', 'html', 'css', 'xml'].includes(
      ext,
    )
  )
    return 'code';
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
  new Date().toLocaleString([], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const keyframes = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes borderRotate {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes zoomPush {
    0%   { opacity: 0; transform: scale(0.5); }
    70%  { opacity: 1; transform: scale(1.08); }
    100% { opacity: 1; transform: scale(1); }
  }
  .drop-overlay img { animation: zoomPush 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes shine {
    0%   { background-position: -100% 0; }
    100% { background-position: 200% 0; }
  }
  .thinking-label { background: linear-gradient(90deg, #737373 0%, #a3a3a3 40%, #d4d4d4 50%, #a3a3a3 60%, #737373 100%); background-size: 200% 100%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shine 2s ease-in-out infinite; }
  .dark .thinking-label { background: linear-gradient(90deg, #a3a3a3 0%, #d4d4d4 40%, #f5f5f5 50%, #d4d4d4 60%, #a3a3a3 100%); background-size: 200% 100%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  .msg-enter { animation: fadeSlideUp 0.22s ease forwards; }
  .thinking-spinner { width: 16px; height: 16px; border: 2px solid #d4d4d4; border-top-color: #737373; border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0; }
  .dark .thinking-spinner { border-color: #525252; border-top-color: #a3a3a3; }
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
  .msgs-area::-webkit-scrollbar { width: 8px; }
  .msgs-area::-webkit-scrollbar-track { background: transparent; }
  .msgs-area::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
  .dark .msgs-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
  .suggest-chip { background: transparent; border: 1px solid #e5e5e5; border-radius: 10px; padding: 10px; font-size: 11px; color: hsl(var(--foreground)); cursor: pointer; text-align: left; transition: all 0.2s ease; font-family: inherit; outline: none; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
  .suggest-chip:focus-visible { border-color: hsl(var(--ring)); box-shadow: 0 0 0 3px hsl(var(--ring) / 0.5); }
  .suggest-chip:hover { border-color: transparent; }
  .dark .suggest-chip { border-color: #3f3f46; }
  .dark .suggest-chip:hover { border-color: transparent; }
  .suggest-icon { font-size: 14px; flex-shrink: 0; line-height: 1; }
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
    background: #ffffff;
    border: 1px solid transparent;
    background-clip: padding-box;
    position: relative;
    box-shadow: 0 3px 10px -3px rgba(168,85,247,0.15), 0 3px 10px -3px rgba(251,146,60,0.1);
    transition: box-shadow 0.3s ease;
  }
  .prompt-box::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    padding: 2px;
    background: linear-gradient(90deg, #f9a8d4, #93c5fd, #fdba74, #f9a8d4, #93c5fd, #fdba74);
    background-size: 300% 100%;
    animation: borderRotate 6s ease-in-out infinite;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
  .dark .prompt-box {
    background: hsl(var(--background));
    border: 1px solid transparent;
    box-shadow: 0 3px 10px -3px rgba(168,85,247,0.2), 0 3px 10px -3px rgba(251,146,60,0.15);
    transition: box-shadow 0.3s ease;
  }
  .dark .prompt-box::before {
    background: linear-gradient(90deg, #f472b6, #60a5fa, #fb923c, #f472b6, #60a5fa, #fb923c);
    background-size: 300% 100%;
    opacity: 0.7;
  }
  .send-btn-active { background: hsl(var(--primary)); }
  .plus-btn:hover { background: rgba(0,0,0,0.08) !important; }
  .dark .plus-btn:hover { background: rgba(255,255,255,0.08) !important; }
  .prompt-box:focus-within { box-shadow: 0 6px 20px -2px rgba(168,85,247,0.35), 0 6px 20px -2px rgba(251,146,60,0.25); }
  .prompt-box:focus-within::before { opacity: 1; background: linear-gradient(90deg, #f472b6, #60a5fa, #fb923c, #f472b6, #60a5fa, #fb923c); background-size: 300% 100%; animation: borderRotate 4s ease-in-out infinite; }
  .dark .prompt-box:focus-within { box-shadow: 0 6px 20px -2px rgba(168,85,247,0.5), 0 6px 20px -2px rgba(251,146,60,0.35); }
  .dark .prompt-box:focus-within::before { opacity: 0.7; }
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
  @keyframes replyPopIn { from { opacity: 0; transform: translate(-50%, -100%) translateY(4px); } to { opacity: 1; transform: translate(-50%, -100%) translateY(0); } }
  .reply-popup { position: fixed; z-index: 100; transform: translate(-50%, -100%); animation: replyPopIn 0.15s ease forwards; }
  .reply-quote { display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start; padding: 5px 6px 2px; border-radius: 10px; background: rgba(120,120,120,0.1); border: 1px solid #e5e5e5; width: 80px; min-width: 80px; height: 56px; gap: 3px; position: relative; box-sizing: border-box; transition: background 0.15s, border-color 0.15s; }
  .reply-quote:hover { background: rgba(120,120,120,0.18); border-color: #d4d4d4; }
  .dark .reply-quote { background: rgba(255,255,255,0.06); border-color: #404040; border-left-color: #525252; }
  .dark .reply-quote:hover { background: rgba(255,255,255,0.12); border-color: #525252; }
  .reply-quote .reply-remove { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: #525252; color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px; line-height: 1; opacity: 0; transition: opacity 0.15s; outline: none; }
  .reply-quote:hover .reply-remove { opacity: 1; }
  .reply-popup button { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; border: none; background: #1a1a1a; color: #fff; font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
  .reply-popup button:hover { background: #333; }
  .dark .reply-popup button { background: #e5e5e5; color: #1a1a1a; }
  .dark .reply-popup button:hover { background: #fff; }
  .msgs-fade { background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1)); }
  .dark .msgs-fade { background: linear-gradient(to bottom, rgba(9,9,11,0), rgba(9,9,11,1)); }
`;

export function AIChatBox({
  onFirstMessage,
}: {
  onFirstMessage?: (text: string) => void;
}) {
  const hasCalledFirstMessage = useRef(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [replyPopup, setReplyPopup] = useState<{
    x: number;
    y: number;
    text: string;
    msgId: number;
  } | null>(null);
  const [replyQuotes, setReplyQuotes] = useState<
    { text: string; msgId: number }[]
  >([]);
  const dragCounterRef = useRef(0);
  const attachRowRef = useRef<HTMLDivElement>(null);
  const attachDrag = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!lightboxSrc) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxSrc(null);
    };
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
      {
        id: msgId,
        role: 'ai',
        text: '',
        time,
        fullDate: getFullDate(),
        streaming: true,
      },
    ]);

    let i = 0;
    streamRef.current = setInterval(() => {
      i++;
      const partial = words.slice(0, i).join(' ');
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, text: partial, streaming: i < words.length }
            : m,
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

  const handleTextSelect = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setReplyPopup(null);
      return;
    }
    const text = sel.toString().trim();
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    // Find which AI message contains the selection
    let node: Node | null = range.startContainer;
    let msgId = 0;
    while (node) {
      if (node instanceof HTMLElement && node.id?.startsWith('msg-')) {
        msgId = parseInt(node.id.replace('msg-', ''), 10);
        break;
      }
      node = node.parentNode;
    }
    setReplyPopup({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      text,
      msgId,
    });
  };

  useEffect(() => {
    const clearHighlights = () => {
      document
        .querySelectorAll('mark[data-reply-highlight]')
        .forEach((mark) => {
          const parent = mark.parentNode;
          if (parent) {
            parent.replaceChild(
              document.createTextNode(mark.textContent || ''),
              mark,
            );
            parent.normalize();
          }
        });
    };
    document.addEventListener('click', clearHighlights);
    return () => document.removeEventListener('click', clearHighlights);
  }, []);

  useEffect(() => {
    const hideOnClick = () => setReplyPopup(null);
    const checkSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setReplyPopup(null);
      }
    };
    document.addEventListener('mousedown', hideOnClick);
    document.addEventListener('selectionchange', checkSelection);
    return () => {
      document.removeEventListener('mousedown', hideOnClick);
      document.removeEventListener('selectionchange', checkSelection);
    };
  }, []);

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
    const hasAttachments =
      pendingImages.length > 0 ||
      pendingFiles.length > 0 ||
      replyQuotes.length > 0;
    if ((!text && !hasAttachments) || typing) return;
    const fullText = text;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    const images = pendingImages.length > 0 ? [...pendingImages] : undefined;
    const files = pendingFiles.length > 0 ? [...pendingFiles] : undefined;
    const quotes = replyQuotes.length > 0 ? [...replyQuotes] : undefined;
    setPendingImages([]);
    setPendingFiles([]);
    setReplyQuotes([]);

    if (!hasCalledFirstMessage.current) {
      hasCalledFirstMessage.current = true;
      onFirstMessage?.(text || (files ? files[0].name : 'Image attachment'));
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: 'user',
        text: fullText,
        time: getTime(),
        fullDate: getFullDate(),
        images,
        files,
        quotes,
      },
    ]);
    setTyping(true);

    setTimeout(() => {
      const reply =
        FAKE_RESPONSES[Math.floor(Math.random() * FAKE_RESPONSES.length)];
      setTyping(false);
      streamResponse(reply);
    }, 800 + Math.random() * 600);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    // Continue bullet list on Shift+Enter
    if (e.key === 'Enter' && e.shiftKey) {
      const ta = e.currentTarget;
      const pos = ta.selectionStart;
      const val = ta.value;
      const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
      const currentLine = val.substring(lineStart, pos);
      if (currentLine.trimStart().startsWith('• ')) {
        // Empty bullet — remove it instead of adding new one
        if (currentLine.trim() === '•') {
          e.preventDefault();
          const newVal = val.substring(0, lineStart) + val.substring(pos);
          setInput(newVal);
          ta.value = newVal;
          ta.selectionStart = ta.selectionEnd = lineStart;
          return;
        }
        e.preventDefault();
        const indent = currentLine.match(/^(\s*)/)?.[1] || '';
        const insert = '\n' + indent + '• ';
        const newVal = val.substring(0, pos) + insert + val.substring(pos);
        setInput(newVal);
        ta.value = newVal;
        ta.selectionStart = ta.selectionEnd = pos + insert.length;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
      }
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
    const ta = e.target;
    let val = ta.value;
    const pos = ta.selectionStart;
    // Auto-convert "- " at line start to "• "
    if (pos >= 2 && val.substring(pos - 2, pos) === '- ') {
      const before = val.substring(0, pos - 2);
      const lineStart = before.lastIndexOf('\n') + 1;
      if (before.substring(lineStart).trim() === '') {
        val = before + '• ' + val.substring(pos);
        setInput(val);
        ta.value = val;
        ta.selectionStart = ta.selectionEnd =
          lineStart + before.substring(lineStart).length + 2;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
        return;
      }
    }
    setInput(val);
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  };

  const isStreaming = messages.some((m) => m.streaming);
  const isEmpty = messages.length === 0 && !typing;

  const promptBox = (
    <div style={{ maxWidth: '560px', margin: '0 auto', width: '100%' }}>
      <div
        className="prompt-box"
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          padding: '0',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={FILE_ACCEPT}
          multiple
          hidden
          onChange={handleFileSelect}
        />
        {(pendingImages.length > 0 ||
          pendingFiles.length > 0 ||
          replyQuotes.length > 0) && (
          <div
            ref={attachRowRef}
            onMouseDown={(e) => {
              const el = attachRowRef.current;
              if (!el) return;
              attachDrag.current = {
                active: true,
                startX: e.pageX - el.offsetLeft,
                scrollLeft: el.scrollLeft,
              };
              el.style.cursor = 'grabbing';
            }}
            onMouseMove={(e) => {
              if (!attachDrag.current.active) return;
              const el = attachRowRef.current;
              if (!el) return;
              e.preventDefault();
              const x = e.pageX - el.offsetLeft;
              el.scrollLeft =
                attachDrag.current.scrollLeft - (x - attachDrag.current.startX);
            }}
            onMouseUp={() => {
              attachDrag.current.active = false;
              if (attachRowRef.current)
                attachRowRef.current.style.cursor = 'grab';
            }}
            onMouseLeave={() => {
              attachDrag.current.active = false;
              if (attachRowRef.current)
                attachRowRef.current.style.cursor = 'grab';
            }}
            style={{
              display: 'flex',
              gap: '8px',
              padding: '12px 12px 0',
              flexWrap: 'nowrap',
              alignItems: 'flex-end',
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollbarWidth: 'none',
              cursor: 'grab',
            }}
          >
            {pendingImages.map((src, i) => (
              <div
                key={'img-' + i}
                className="img-preview-wrap"
                style={{ display: 'flex', flexShrink: 0, userSelect: 'none' }}
              >
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  style={{
                    height: '52px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    display: 'block',
                    border: '1px solid #e5e5e5',
                    pointerEvents: attachDrag.current.active ? 'none' : 'auto',
                  }}
                />
                <button
                  className="img-remove"
                  onClick={() => removePendingImage(i)}
                >
                  ×
                </button>
              </div>
            ))}
            {pendingFiles.map((file, i) => (
              <div
                key={'file-' + i}
                className="file-chip-pending"
                style={{ flexShrink: 0, userSelect: 'none' }}
              >
                <div className="file-chip">
                  <span style={{ fontSize: '20px' }}>
                    {FILE_ICONS[file.type]}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'hsl(var(--foreground))',
                      }}
                    >
                      {file.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#a3a3a3' }}>
                      {file.size}
                    </div>
                  </div>
                </div>
                <button
                  className="img-remove"
                  onClick={() => removePendingFile(i)}
                >
                  ×
                </button>
              </div>
            ))}
            {replyQuotes.map((quote, i) => (
              <div
                key={'quote-' + i}
                className="reply-quote"
                style={{ flexShrink: 0, userSelect: 'none' }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#525252"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M9 14L4 9l5-5" />
                  <path d="M20 20v-7a4 4 0 00-4-4H4" />
                </svg>
                <span
                  style={{
                    fontSize:
                      quote.text.length > 80
                        ? '7px'
                        : quote.text.length > 40
                        ? '8px'
                        : '9px',
                    color: 'hsl(var(--foreground))',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                    maxWidth: '100%',
                  }}
                >
                  {quote.text}
                </span>
                <button
                  className="reply-remove"
                  onClick={() =>
                    setReplyQuotes((prev) => prev.filter((_, idx) => idx !== i))
                  }
                >
                  ×
                </button>
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
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: 'hsl(var(--foreground))',
            fontSize: '14px',
            lineHeight: 1.6,
            resize: 'none',
            maxHeight: '140px',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
            padding: '12px',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 6px 6px',
          }}
        >
          <button
            className="plus-btn"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--muted-foreground))',
              transition: 'background 0.15s',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            className={`send-btn ${
              (input.trim() ||
                pendingImages.length > 0 ||
                pendingFiles.length > 0 ||
                replyQuotes.length > 0) &&
              !typing &&
              !isStreaming
                ? 'send-btn-active'
                : 'send-btn-disabled'
            }`}
            onClick={sendMessage}
            disabled={
              (!input.trim() &&
                pendingImages.length === 0 &&
                pendingFiles.length === 0 &&
                replyQuotes.length === 0) ||
              typing ||
              isStreaming
            }
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              border: 'none',
              cursor:
                (input.trim() ||
                  pendingImages.length > 0 ||
                  pendingFiles.length > 0 ||
                  replyQuotes.length > 0) &&
                !typing &&
                !isStreaming
                  ? 'pointer'
                  : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 19V5"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 12L12 5L19 12"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
      <p style={{ textAlign: 'center', fontSize: '11px', margin: '8px 0 0' }}>
        <a
          href="https://www.activepieces.com/product/ai-adoption"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#a3a3a3',
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = 'hsl(var(--foreground))')
          }
          onMouseLeave={(e) => (e.currentTarget.style.color = '#a3a3a3')}
        >
          Activepieces AI can help you automate anything.
        </a>
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
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
          background: 'hsl(var(--background))',
        }}
      >
        {isEmpty ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              padding: '32px 24px',
            }}
          >
            <h2
              style={{
                fontSize: '32px',
                fontWeight: 700,
                margin: 0,
                textAlign: 'center',
                fontFamily: '"Sentient", serif',
                color: 'hsl(var(--foreground))',
                maxWidth: '560px',
                width: '100%',
                textWrap: 'balance',
                lineHeight: 1.2,
              }}
            >
              {(() => {
                const hour = new Date().getHours();
                if (hour >= 6 && hour < 12)
                  return (
                    <>Everything starts with an idea… what&apos;s yours?</>
                  );
                if (hour >= 12 && hour < 18)
                  return <>Let&apos;s turn ideas into something real</>;
                return <>Quiet moments build the best things</>;
              })()}
            </h2>
            <div style={{ width: '100%' }}>{promptBox}</div>
            <div
              style={{
                maxWidth: '560px',
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px',
              }}
            >
              {[
                {
                  text: 'Summarize a document for me',
                  icon: '📄',
                  color: '#f0e6ff',
                  darkColor: 'rgba(160,108,232,0.15)',
                },
                {
                  text: 'Help me write an automation flow',
                  icon: '⚡',
                  color: '#fff3e0',
                  darkColor: 'rgba(255,167,38,0.15)',
                },
                {
                  text: 'What integrations do you support?',
                  icon: '🔌',
                  color: '#e8f5e9',
                  darkColor: 'rgba(76,175,80,0.15)',
                },
                {
                  text: 'How do I connect two apps?',
                  icon: '🔗',
                  color: '#e3f2fd',
                  darkColor: 'rgba(66,165,245,0.15)',
                },
              ].map((item) => (
                <button
                  key={item.text}
                  className="suggest-chip"
                  onClick={() => {
                    setInput(item.text);
                    textareaRef.current?.focus();
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      document.documentElement.classList.contains('dark')
                        ? item.darkColor
                        : item.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span className="suggest-icon">{item.icon}</span>
                  <span>{item.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div
              className="msgs-area"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 0 0',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  maxWidth: '560px',
                  width: '100%',
                  margin: '0 auto',
                  padding: '0 0 40px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {messages.map((msg) =>
                  msg.role === 'ai' ? (
                    <div
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      className="msg-enter"
                      style={{ padding: '8px 0' }}
                      onMouseUp={handleTextSelect}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: '14px',
                          lineHeight: 1.65,
                          color: 'hsl(var(--foreground))',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {msg.text}
                        {msg.streaming && <span className="cursor" />}
                      </p>
                    </div>
                  ) : (
                    <div
                      key={msg.id}
                      className="msg-enter user-msg-wrap"
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        padding: '8px 0',
                      }}
                    >
                      <div style={{ maxWidth: '75%' }}>
                        {msg.images && msg.images.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '6px',
                              flexWrap: 'wrap',
                              marginBottom: msg.text ? '6px' : 0,
                              justifyContent: 'flex-end',
                            }}
                          >
                            {msg.images.map((src, i) => (
                              <img
                                key={i}
                                src={src}
                                alt=""
                                className="chat-img"
                                onClick={() => setLightboxSrc(src)}
                                style={{
                                  maxWidth: '200px',
                                  maxHeight: '150px',
                                  borderRadius: '12px',
                                  objectFit: 'cover',
                                  display: 'block',
                                }}
                              />
                            ))}
                          </div>
                        )}
                        {msg.files && msg.files.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '6px',
                              flexWrap: 'wrap',
                              marginBottom: msg.text ? '6px' : 0,
                              justifyContent: 'flex-end',
                            }}
                          >
                            {msg.files.map((file, i) => (
                              <div key={i} className="file-chip">
                                <span style={{ fontSize: '18px' }}>
                                  {FILE_ICONS[file.type]}
                                </span>
                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      color: 'hsl(var(--foreground))',
                                    }}
                                  >
                                    {file.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '10px',
                                      color: '#a3a3a3',
                                    }}
                                  >
                                    {file.size}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.quotes && msg.quotes.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '6px',
                              flexWrap: 'wrap',
                              marginBottom: msg.text ? '6px' : 0,
                              justifyContent: 'flex-end',
                            }}
                          >
                            {msg.quotes.map((quote, i) => (
                              <div
                                key={i}
                                className="reply-quote"
                                style={{
                                  userSelect: 'none',
                                  cursor: 'pointer',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const el = document.getElementById(
                                    `msg-${quote.msgId}`,
                                  );
                                  if (!el) return;
                                  // Clear any existing highlights first
                                  document
                                    .querySelectorAll(
                                      'mark[data-reply-highlight]',
                                    )
                                    .forEach((m) => {
                                      const p = m.parentNode;
                                      if (p) {
                                        p.replaceChild(
                                          document.createTextNode(
                                            m.textContent || '',
                                          ),
                                          m,
                                        );
                                        p.normalize();
                                      }
                                    });
                                  el.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'center',
                                  });
                                  // Highlight the specific quoted text within the message
                                  const walker = document.createTreeWalker(
                                    el,
                                    NodeFilter.SHOW_TEXT,
                                  );
                                  let node: Text | null;
                                  while (
                                    (node = walker.nextNode() as Text | null)
                                  ) {
                                    const idx =
                                      node.textContent?.indexOf(quote.text) ??
                                      -1;
                                    if (idx === -1) continue;
                                    const range = document.createRange();
                                    range.setStart(node, idx);
                                    range.setEnd(node, idx + quote.text.length);
                                    const mark = document.createElement('mark');
                                    mark.setAttribute(
                                      'data-reply-highlight',
                                      '',
                                    );
                                    const isDark =
                                      document.documentElement.classList.contains(
                                        'dark',
                                      );
                                    mark.style.background = isDark
                                      ? 'rgba(200,200,200,0.3)'
                                      : 'rgba(120,120,120,0.2)';
                                    mark.style.color = 'inherit';
                                    mark.style.borderRadius = '0';
                                    mark.style.padding = '2px 0';
                                    mark.style.transition =
                                      'background 0.4s ease';
                                    range.surroundContents(mark);
                                    setTimeout(() => {
                                      mark.style.background = 'transparent';
                                    }, 3000);
                                    setTimeout(() => {
                                      const parent = mark.parentNode;
                                      if (parent) {
                                        parent.replaceChild(
                                          document.createTextNode(
                                            mark.textContent || '',
                                          ),
                                          mark,
                                        );
                                        parent.normalize();
                                      }
                                    }, 3500);
                                    break;
                                  }
                                }}
                              >
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#525252"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  style={{ flexShrink: 0 }}
                                >
                                  <path d="M9 14L4 9l5-5" />
                                  <path d="M20 20v-7a4 4 0 00-4-4H4" />
                                </svg>
                                <span
                                  style={{
                                    fontSize:
                                      quote.text.length > 80
                                        ? '7px'
                                        : quote.text.length > 40
                                        ? '8px'
                                        : '9px',
                                    color: 'hsl(var(--foreground))',
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    lineHeight: 1.3,
                                    wordBreak: 'break-word',
                                    maxWidth: '100%',
                                  }}
                                >
                                  {quote.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.text && (
                          <div
                            style={{
                              background: 'rgba(120, 120, 120, 0.18)',
                              color: 'hsl(var(--foreground))',
                              padding: '10px 16px',
                              borderRadius: '18px 18px 4px 18px',
                              fontSize: '14px',
                              lineHeight: 1.6,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                            }}
                          >
                            {msg.text}
                          </div>
                        )}
                        <div
                          className="msg-meta"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '6px',
                            marginTop: '4px',
                          }}
                        >
                          <span className="msg-tip">
                            <span
                              style={{ fontSize: '12px', color: '#a3a3a3' }}
                            >
                              {msg.time}
                            </span>
                            <span className="tip-text">{msg.fullDate}</span>
                          </span>
                          {msg.text && (
                            <>
                              <span className="msg-tip">
                                <button
                                  className="msg-action"
                                  onClick={() => {
                                    navigator.clipboard.writeText(msg.text);
                                    setCopiedId(msg.id);
                                    setTimeout(() => setCopiedId(null), 1500);
                                  }}
                                >
                                  {copiedId === msg.id ? (
                                    <svg
                                      width="15"
                                      height="15"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                    >
                                      <path
                                        d="M20 6L9 17l-5-5"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      width="15"
                                      height="15"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                    >
                                      <rect
                                        x="9"
                                        y="9"
                                        width="13"
                                        height="13"
                                        rx="2"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      />
                                      <path
                                        d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      />
                                    </svg>
                                  )}
                                </button>
                                <span className="tip-text">
                                  {copiedId === msg.id ? 'Copied!' : 'Copy'}
                                </span>
                              </span>
                              <span className="msg-tip">
                                <button
                                  className="msg-action"
                                  onClick={() => {
                                    setInput(msg.text);
                                    textareaRef.current?.focus();
                                  }}
                                >
                                  <svg
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <line x1="3" x2="21" y1="6" y2="6" />
                                    <path d="M3 12h15a3 3 0 1 1 0 6h-4" />
                                    <polyline points="16 16 14 18 16 20" />
                                    <line x1="3" x2="10" y1="18" y2="18" />
                                  </svg>
                                </button>
                                <span className="tip-text">Add to prompt</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                )}
                {typing && (
                  <div className="msg-enter" style={{ padding: '8px 0' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                      }}
                    >
                      <div className="thinking-spinner" />
                      <span
                        className="thinking-label"
                        style={{ fontSize: '13px', fontWeight: 500 }}
                      >
                        Thinking
                      </span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div
                className="msgs-fade"
                style={{
                  position: 'sticky',
                  bottom: 0,
                  height: '28px',
                  marginTop: '-28px',
                  pointerEvents: 'none',
                  flexShrink: 0,
                }}
              />
            </div>
            <div style={{ padding: '0 24px 10px', flexShrink: 0 }}>
              {promptBox}
            </div>
          </>
        )}
        {isDragging && (
          <div className="drop-overlay">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <img
                src={dropMediaImg}
                alt=""
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'contain',
                }}
              />
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'hsl(var(--foreground))',
                }}
              >
                Add anything
              </span>
              <span
                style={{ fontSize: '14px', color: 'hsl(var(--foreground))' }}
              >
                Drop any file here to add it to the conversation
              </span>
            </div>
          </div>
        )}
      </div>
      {replyPopup &&
        createPortal(
          <div
            className="reply-popup"
            style={{ left: replyPopup.x, top: replyPopup.y }}
          >
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                setReplyQuotes((prev) => [
                  ...prev,
                  { text: replyPopup.text, msgId: replyPopup.msgId },
                ]);
                setReplyPopup(null);
                window.getSelection()?.removeAllRanges();
                textareaRef.current?.focus();
              }}
            >
              Reply
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transform: 'scaleX(-1)' }}
              >
                <polyline points="15 17 20 12 15 7" />
                <path d="M4 18v-2a4 4 0 014-4h12" />
              </svg>
            </button>
          </div>,
          document.body,
        )}
      {lightboxSrc && (
        <div className="lightbox" onClick={() => setLightboxSrc(null)}>
          <button
            onClick={() => setLightboxSrc(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')
            }
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxSrc}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{ cursor: 'default' }}
          />
        </div>
      )}
    </>
  );
}
