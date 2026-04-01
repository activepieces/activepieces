import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

import dropMediaImg from '@/assets/img/drop-media.svg';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  .openai-icon { color: #000000; }
  .dark .openai-icon { color: #e5e5e5; }
  .model-btn { display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 8px; border: none; background: transparent; cursor: pointer; font-family: inherit; font-size: 12px; color: #8a8a8a; transition: background 0.15s, color 0.15s; outline: none; white-space: nowrap; }
  .dark .model-btn { color: #8a8a8a; }
  .model-btn:hover, .model-btn.open { background: rgba(0,0,0,0.06); color: hsl(var(--foreground)); }
  .dark .model-btn:hover, .dark .model-btn.open { background: rgba(255,255,255,0.08); color: #e5e5e5; }
  .model-menu { position: absolute; bottom: 100%; left: 0; margin-bottom: 6px; background: #fff; border: 1px solid #e5e5e5; border-radius: 10px; padding: 4px; min-width: 160px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); z-index: 20; animation: fadeSlideUp 0.12s ease; }
  .dark .model-menu { background: #1c1c1e; border-color: #3f3f46; box-shadow: 0 4px 16px rgba(0,0,0,0.4); }
  .model-option { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 7px 10px; border-radius: 7px; border: none; background: transparent; cursor: pointer; font-family: inherit; font-size: 12px; color: hsl(var(--foreground)); transition: background 0.12s; outline: none; text-align: left; }
  .model-option:hover { background: rgba(0,0,0,0.06); }
  .dark .model-option:hover { background: rgba(255,255,255,0.08); }
  .model-option.active { font-weight: 600; }
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
  .plus-btn:hover, .plus-btn.open { background: rgba(0,0,0,0.08) !important; }
  .dark .plus-btn:hover, .dark .plus-btn.open { background: rgba(255,255,255,0.08) !important; }
  .plus-menu { position: absolute; bottom: 100%; left: 0; background: #fff; border: 1px solid #e5e5e5; border-radius: 10px; padding: 4px; min-width: 200px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); z-index: 20; margin-bottom: 4px; animation: fadeSlideUp 0.12s ease-out; }
  .dark .plus-menu { background: #1c1c1e; border-color: #3f3f46; box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
  .plus-menu-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 10px; border-radius: 7px; border: none; background: transparent; cursor: pointer; font-family: inherit; font-size: 12px; color: hsl(var(--foreground)); transition: background 0.1s; outline: none; }
  .plus-menu-item:hover { background: rgba(0,0,0,0.06); }
  .dark .plus-menu-item:hover { background: rgba(255,255,255,0.08); }
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
  incognito,
}: {
  onFirstMessage?: (text: string) => void;
  incognito?: boolean;
}) {
  const hasCalledFirstMessage = useRef(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState('GPT-4o');
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
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
    <div
      style={{
        maxWidth: 'clamp(280px, calc(100vw - 700px), 560px)',
        margin: '0 auto',
        width: '100%',
      }}
    >
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
            padding: '6px 6px 6px',
          }}
        >
          <div style={{ position: 'relative' }}>
            <button
              className={`plus-btn ${plusMenuOpen ? 'open' : ''}`}
              onClick={() => setPlusMenuOpen(!plusMenuOpen)}
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            {plusMenuOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 19 }}
                  onClick={() => setPlusMenuOpen(false)}
                />
                <div className="plus-menu">
                  <button
                    className="plus-menu-item"
                    onClick={() => {
                      setPlusMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551" />
                    </svg>
                    Upload files or images
                  </button>
                  <button
                    className="plus-menu-item"
                    onClick={() => setPlusMenuOpen(false)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22v-5" />
                      <path d="M15 8V2" />
                      <path d="M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z" />
                      <path d="M9 8V2" />
                    </svg>
                    Connectors and sources
                  </button>
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ position: 'relative' }}>
              <button
                className={`model-btn ${modelMenuOpen ? 'open' : ''}`}
                onClick={() => setModelMenuOpen(!modelMenuOpen)}
              >
                {selectedModel}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{
                    transition: 'transform 0.15s',
                    transform: modelMenuOpen
                      ? 'rotate(180deg)'
                      : 'rotate(0deg)',
                  }}
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {modelMenuOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 19 }}
                    onClick={() => setModelMenuOpen(false)}
                  />
                  <div
                    className="model-menu"
                    style={{ right: 0, left: 'auto' }}
                  >
                    {[
                      {
                        name: 'GPT-4o',
                        icon: (
                          <svg width="14" height="14" viewBox="0 0 24 24">
                            <path
                              d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
                              fill="currentColor"
                              className="openai-icon"
                            />
                          </svg>
                        ),
                      },
                      {
                        name: 'GPT-4o mini',
                        icon: (
                          <svg width="14" height="14" viewBox="0 0 24 24">
                            <path
                              d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
                              fill="currentColor"
                              className="openai-icon"
                            />
                          </svg>
                        ),
                      },
                      {
                        name: 'Claude Sonnet',
                        icon: (
                          <svg width="14" height="14" viewBox="0 0 24 24">
                            <path
                              d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"
                              fill="#D97757"
                            />
                          </svg>
                        ),
                      },
                      {
                        name: 'Claude Haiku',
                        icon: (
                          <svg width="14" height="14" viewBox="0 0 24 24">
                            <path
                              d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"
                              fill="#D97757"
                            />
                          </svg>
                        ),
                      },
                      {
                        name: 'Gemini Pro',
                        icon: (
                          <svg width="14" height="14" viewBox="0 0 24 24">
                            <path
                              d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"
                              fill="#4285F4"
                            />
                          </svg>
                        ),
                      },
                    ].map(({ name, icon }) => (
                      <button
                        key={name}
                        className={`model-option ${
                          selectedModel === name ? 'active' : ''
                        }`}
                        onClick={() => {
                          setSelectedModel(name);
                          setModelMenuOpen(false);
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          {icon}
                          {name}
                        </span>
                        {selectedModel === name && (
                          <svg
                            width="12"
                            height="12"
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
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
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
      </div>
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
                maxWidth: 'clamp(280px, calc(100vw - 700px), 560px)',
                width: '100%',
                textWrap: 'balance',
                lineHeight: 1.2,
              }}
            >
              {incognito ? (
                <>Incognito Chat</>
              ) : (
                (() => {
                  const hour = new Date().getHours();
                  if (hour >= 6 && hour < 12)
                    return (
                      <>Everything starts with an idea… what&apos;s yours?</>
                    );
                  if (hour >= 12 && hour < 18)
                    return <>Let&apos;s turn ideas into something real</>;
                  return <>Quiet moments build the best things</>;
                })()
              )}
            </h2>
            {incognito && (
              <p
                style={{
                  fontSize: '20px',
                  fontFamily: '"Sentient", serif',
                  color: 'hsl(var(--muted-foreground))',
                  margin: '-16px 0 0',
                  textAlign: 'center',
                }}
              >
                This chat won&apos;t appear in your chat history.
              </p>
            )}
            <div style={{ width: '100%' }}>{promptBox}</div>
            <div
              style={{
                maxWidth: 'clamp(280px, calc(100vw - 700px), 560px)',
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
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
                  maxWidth: 'clamp(280px, calc(100vw - 700px), 560px)',
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                style={{
                                  fontSize: '12px',
                                  color: '#a3a3a3',
                                  cursor: 'default',
                                }}
                              >
                                {msg.time}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              {msg.fullDate}
                            </TooltipContent>
                          </Tooltip>
                          {msg.text && (
                            <Tooltip>
                              <TooltipTrigger asChild>
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
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                {copiedId === msg.id ? 'Copied!' : 'Copy'}
                              </TooltipContent>
                            </Tooltip>
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
        <p style={{ textAlign: 'center', fontSize: '11px', padding: '6px 0 12px', flexShrink: 0 }}>
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
