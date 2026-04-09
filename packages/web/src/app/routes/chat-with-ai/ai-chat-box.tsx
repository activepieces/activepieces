import {
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code,
  Copy,
  FileSpreadsheet,
  FileText,
  Image,
  Link,
  Paperclip,
  Plug,
  Plus,
  RefreshCw,
  Reply,
  Square,
  X,
  Zap,
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Lottie from 'react-lottie';

import dropMediaImg from '@/assets/img/drop-media.svg';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MarkdownVariant } from '@activepieces/shared';

import { ApMarkdown } from '@/components/custom/markdown';
import { cn } from '@/lib/utils';

import { DelayedTooltip } from './delayed-tooltip';
import thinkingLoaderData from './thinking-loader.json';

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
  responses?: string[];
  responseIndex?: number;
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

const FILE_ICON_MAP: Record<Attachment['type'], typeof FileText> = {
  image: Image,
  document: FileText,
  spreadsheet: FileSpreadsheet,
  code: Code,
  other: Paperclip,
};

import { authenticationSession } from '@/lib/authentication-session';
import { API_URL } from '@/lib/api';

const IMAGE_KEYWORDS_EXACT = [
  'صورة',
  'صوره',
  'ارسم',
  'ارسملي',
  'اعمل صور',
  'ولد صور',
  'اعملي صور',
  'picture of',
  'صمم',
  'صمملي',
  'draw',
];

const IMAGE_VERB_NOUN_PAIRS: [string[], string[]][] = [
  [
    [
      'generate',
      'create',
      'make',
      'produce',
      'اعمل',
      'اعملي',
      'ولد',
      'سوي',
      'سولي',
    ],
    ['image', 'photo', 'picture', 'pic', 'صورة', 'صوره', 'صور'],
  ],
];

const isImageRequest = (text: string) => {
  const lower = text.toLowerCase();
  if (IMAGE_KEYWORDS_EXACT.some((kw) => lower.includes(kw))) return true;
  return IMAGE_VERB_NOUN_PAIRS.some(
    ([verbs, nouns]) =>
      verbs.some((v) => lower.includes(v)) &&
      nouns.some((n) => lower.includes(n)),
  );
};

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

  .thinking-label { background: linear-gradient(90deg, var(--muted-foreground) 0%, color-mix(in srgb, var(--muted-foreground) 60%, transparent) 40%, color-mix(in srgb, var(--muted-foreground) 30%, transparent) 50%, color-mix(in srgb, var(--muted-foreground) 60%, transparent) 60%, var(--muted-foreground) 100%); background-size: 200% 100%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shineLtr 2s linear infinite; }
  @keyframes shineLtr { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
  .img-gen-label { background: linear-gradient(90deg, var(--muted-foreground) 0%, color-mix(in srgb, var(--muted-foreground) 60%, transparent) 40%, color-mix(in srgb, var(--muted-foreground) 30%, transparent) 50%, color-mix(in srgb, var(--muted-foreground) 60%, transparent) 60%, var(--muted-foreground) 100%); background-size: 200% 100%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shineLtr 2s linear infinite; }
  .msg-enter { animation: fadeSlideUp 0.22s ease forwards; }
  .ai-msg-actions { opacity: 0; transition: opacity 0.15s; }
  .ai-msg:hover .ai-msg-actions { opacity: 1; }
  @keyframes shimmer { 0% { background-position: 200% 200%; } 100% { background-position: -100% -100%; } }
  .img-shimmer { background-color: var(--muted); background-image: linear-gradient(135deg, transparent 35%, color-mix(in srgb, var(--muted-foreground) 14%, var(--muted)) 50%, transparent 65%); background-size: 300% 300%; background-repeat: no-repeat; animation: shimmer 1.4s linear infinite; }
  .openai-icon { color: var(--foreground); }
  .send-btn:hover { opacity: 0.85; }
  .send-btn { transition: opacity 0.15s; outline: none; }
  .send-btn:focus-visible { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 50%, transparent); }
  .plus-btn { outline: none; }
  .plus-btn:focus-visible { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 50%, transparent); }
  textarea:focus { outline: none; }
  .user-msg-wrap .msg-meta { opacity: 0; transition: opacity 0.15s; }
  .user-msg-wrap:hover .msg-meta { opacity: 1; }
  .msg-action { background: transparent; border: none; cursor: pointer; padding: 4px; border-radius: 6px; color: var(--muted-foreground); outline: none !important; transition: color 0.15s, background 0.15s; position: relative; }
  .msg-action:focus { outline: none !important; }
  .msg-action:hover { color: var(--foreground); background: var(--muted); }
  .dark .msg-action:hover { background: var(--accent); }
  .msgs-area::-webkit-scrollbar { width: 12px; }
  .msgs-area::-webkit-scrollbar-track { background: transparent; }
  .msgs-area::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--muted-foreground) 20%, transparent); border-radius: 4px; border: 2px solid transparent; background-clip: padding-box; }
  .suggest-chip { background: transparent; border: 1px solid var(--border); border-radius: 10px; padding: 10px; font-size: 11px; color: var(--foreground); cursor: pointer; text-align: left; transition: all 0.2s ease; font-family: inherit; outline: none; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
  .suggest-chip:focus-visible { border-color: var(--ring); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 50%, transparent); }
  .suggest-chip:hover { border-color: transparent; }
  .suggest-icon { font-size: 14px; flex-shrink: 0; line-height: 1; }
  .img-preview-wrap img { border: 1px solid var(--border) !important; }
  .img-preview-wrap { position: relative; display: inline-block; }
  .img-preview-wrap .img-remove { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: var(--muted-foreground); color: var(--background); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px; line-height: 1; opacity: 0; transition: opacity 0.15s; outline: none; }
  .img-preview-wrap:hover .img-remove { opacity: 1; }
  .file-chip { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; background: var(--muted); border: 1px solid var(--border); font-family: inherit; max-width: 200px; }
  .file-chip-pending { position: relative; }
  .file-chip-pending .img-remove { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: var(--muted-foreground); color: var(--background); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px; line-height: 1; opacity: 0; transition: opacity 0.15s; outline: none; }
  .file-chip-pending:hover .img-remove { opacity: 1; }
  .prompt-box {
    background: var(--background);
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
    background: var(--background);
    border: 1px solid transparent;
    box-shadow: 0 3px 10px -3px rgba(168,85,247,0.2), 0 3px 10px -3px rgba(251,146,60,0.15);
    transition: box-shadow 0.3s ease;
  }
  .dark .prompt-box::before {
    background: linear-gradient(90deg, #f472b6, #60a5fa, #fb923c, #f472b6, #60a5fa, #fb923c);
    background-size: 300% 100%;
    opacity: 0.7;
  }
  .send-btn-active { background: var(--color-primary); }
  .plus-btn:hover, .plus-btn.open { background: var(--muted) !important; }
  .dark .plus-btn:hover, .dark .plus-btn.open { background: var(--accent) !important; }
  .plus-menu { position: absolute; bottom: 100%; left: 0; background: var(--popover); border: 1px solid var(--border); border-radius: 10px; padding: 4px; min-width: 240px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); z-index: 20; margin-bottom: 4px; animation: fadeSlideUp 0.12s ease-out; }
  .plus-menu-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 7px 12px; border-radius: 7px; border: none; background: transparent; cursor: pointer; font-family: inherit; font-size: 14px; color: var(--foreground); transition: background 0.1s; outline: none; }
  .plus-menu-item:hover { background: var(--muted); }
  .dark .plus-menu-item:hover { background: var(--accent); }
  .prompt-box:focus-within { box-shadow: 0 6px 20px -2px rgba(168,85,247,0.35), 0 6px 20px -2px rgba(251,146,60,0.25); }
  .prompt-box:focus-within::before { opacity: 1; background: linear-gradient(90deg, #f472b6, #60a5fa, #fb923c, #f472b6, #60a5fa, #fb923c); background-size: 300% 100%; animation: borderRotate 4s ease-in-out infinite; }
  .dark .prompt-box:focus-within { box-shadow: 0 6px 20px -2px rgba(168,85,247,0.5), 0 6px 20px -2px rgba(251,146,60,0.35); }
  .dark .prompt-box:focus-within::before { opacity: 0.7; }
  .send-btn-disabled { background: var(--border) !important; }
  .dark .send-btn-disabled { background: var(--accent) !important; }
  .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 100; cursor: default; animation: fadeIn 0.15s ease; }
  .lightbox img { max-width: 90vw; max-height: 90vh; border-radius: 8px; object-fit: contain; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .chat-img { cursor: pointer; transition: opacity 0.15s; border: 1px solid var(--border); }
  .chat-img:hover { opacity: 0.85; }
  .drop-overlay { position: absolute; top: 0; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 700px; z-index: 50; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--background) 85%, transparent); pointer-events: none; }
  @keyframes replyPopIn { from { opacity: 0; transform: translate(-50%, -100%) translateY(4px); } to { opacity: 1; transform: translate(-50%, -100%) translateY(0); } }
  .reply-popup { position: fixed; z-index: 100; transform: translate(-50%, -100%); animation: replyPopIn 0.15s ease forwards; }
  .reply-quote { display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start; padding: 5px 6px 2px; border-radius: 10px; background: var(--muted); border: 1px solid var(--border); width: 80px; min-width: 80px; height: 56px; gap: 3px; position: relative; box-sizing: border-box; transition: background 0.15s, border-color 0.15s; }
  .reply-quote:hover { background: var(--muted); border-color: var(--border); }
  .reply-quote .reply-remove { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: var(--muted-foreground); color: var(--background); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px; line-height: 1; opacity: 0; transition: opacity 0.15s; outline: none; }
  .reply-quote:hover .reply-remove { opacity: 1; }
  .reply-popup button { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; border: none; background: var(--foreground); color: var(--background); font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
  .reply-popup button:hover { opacity: 0.9; }
  .prompt-float { background: transparent; padding-right: 8px; }
  .prompt-float-inner { max-width: clamp(280px, calc(100vw - 700px), 560px); margin: 0 auto; width: 100%; }
  .prompt-float-footer { background: linear-gradient(to bottom, transparent, var(--background) 40%); max-width: calc(clamp(280px, calc(100vw - 700px), 560px) + 20px); margin: 0 auto; width: calc(100% + 20px); padding-top: 80px; margin-top: -80px; }
`;

/* ─── Mock sources for demo ─── */
const MOCK_FAVICONS = [
  'https://www.google.com/favicon.ico',
  'https://www.wikipedia.org/favicon.ico',
  'https://www.reddit.com/favicon.ico',
  'https://www.github.com/favicon.ico',
  'https://stackoverflow.com/favicon.ico',
  'https://www.youtube.com/favicon.ico',
  'https://medium.com/favicon.ico',
  'https://www.amazon.com/favicon.ico',
  'https://www.nytimes.com/favicon.ico',
  'https://www.bbc.com/favicon.ico',
];

function getMockSources(msgId: number) {
  const count = (msgId % 15) + 3;
  // Pick favicons deterministically based on msgId
  const favicons: string[] = [];
  for (let i = 0; i < Math.min(count, 4); i++) {
    favicons.push(MOCK_FAVICONS[(msgId + i) % MOCK_FAVICONS.length]);
  }
  return { count, favicons };
}

/* ─── Smooth streaming text component ─── */
const WORD_INTERVAL = 50; // ms per word

function StreamingText({
  fullText,
  streaming,
}: {
  fullText: string;
  streaming: boolean;
}) {
  // Words buffer: complete words waiting to be displayed
  const wordBufferRef = useRef<string[]>([]);
  // Partial token that hasn't formed a complete word yet
  const partialRef = useRef('');
  // Words already displayed
  const [displayedWords, setDisplayedWords] = useState<string[]>([]);
  const displayedCountRef = useRef(0);
  const prevFullTextRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Push new text into the word buffer whenever fullText grows
  useEffect(() => {
    if (fullText.length > prevFullTextRef.current.length) {
      const newChars = fullText.slice(prevFullTextRef.current.length);
      // Combine with any leftover partial word
      const combined = partialRef.current + newChars;
      // Split into tokens preserving whitespace: ["word", " ", "word", " ", ...]
      const tokens = combined.split(/(\s+)/);
      // Last token might be incomplete if streaming — hold it back
      if (streaming) {
        partialRef.current = tokens.pop() || '';
      } else {
        partialRef.current = '';
      }
      // Push complete tokens into the buffer
      for (const t of tokens) {
        if (t) wordBufferRef.current.push(t);
      }
    }
    prevFullTextRef.current = fullText;
  }, [fullText, streaming]);

  // When streaming ends, flush any remaining partial
  useEffect(() => {
    if (!streaming && partialRef.current) {
      wordBufferRef.current.push(partialRef.current);
      partialRef.current = '';
    }
  }, [streaming]);

  // Interval loop: pull one word from buffer at steady rate
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (wordBufferRef.current.length > 0) {
        const word = wordBufferRef.current.shift()!;
        displayedCountRef.current += 1;
        setDisplayedWords((prev) => [...prev, word]);
      } else if (!streaming) {
        // Buffer empty and done streaming — stop the timer
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, WORD_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [streaming]);

  // When streaming stops and buffer is empty, make sure we show everything
  useEffect(() => {
    if (
      !streaming &&
      wordBufferRef.current.length === 0 &&
      partialRef.current === ''
    ) {
      const allWords = fullText.split(/(\s+)/).filter(Boolean);
      if (displayedCountRef.current < allWords.length) {
        displayedCountRef.current = allWords.length;
        setDisplayedWords(allWords);
      }
    }
  }, [streaming, fullText, displayedWords]);

  const rendered = useMemo(() => {
    if (!displayedWords.length) return null;
    return displayedWords.join('');
  }, [displayedWords]);

  return (
    <p className="m-0 text-base leading-relaxed text-accent-foreground dark:text-neutral-300 whitespace-pre-wrap">
      {rendered}
    </p>
  );
}

export function AIChatBox({
  onFirstMessage,
  incognito,
}: {
  onFirstMessage?: (text: string) => void;
  incognito?: boolean;
}) {
  const thinkingPhrases = [
    'Thinking...',
    'Analyzing your question...',
    'Working on it...',
    'Almost there...',
    'Gathering thoughts...',
  ];
  const pickThinkingText = () =>
    thinkingPhrases[Math.floor(Math.random() * thinkingPhrases.length)];

  const hasCalledFirstMessage = useRef(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [thinkingText, setThinkingText] = useState('Thinking');
  const [imgProgress, setImgProgress] = useState<Record<number, number>>({});
  const imgTimersRef = useRef<Record<number, ReturnType<typeof setInterval>>>(
    {},
  );
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
  const thinkingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const startImgProgress = (msgId: number) => {
    setImgProgress((prev) => ({ ...prev, [msgId]: 0 }));
    imgTimersRef.current[msgId] = setInterval(() => {
      setImgProgress((prev) => {
        const current = prev[msgId] ?? 0;
        if (current >= 90) return prev;
        const increment = current < 30 ? 5 : current < 60 ? 3 : 1;
        return { ...prev, [msgId]: current + increment };
      });
    }, 300);
  };

  const finishImgProgress = (msgId: number) => {
    if (imgTimersRef.current[msgId]) {
      clearInterval(imgTimersRef.current[msgId]);
      delete imgTimersRef.current[msgId];
    }
    setImgProgress((prev) => ({ ...prev, [msgId]: 100 }));
    setTimeout(() => {
      setImgProgress((prev) => {
        const next = { ...prev };
        delete next[msgId];
        return next;
      });
    }, 500);
  };

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

  const conversationIdRef = useRef<string | null>(null);

  const getOrCreateConversation = async (): Promise<string> => {
    if (conversationIdRef.current) return conversationIdRef.current;
    const projectId = authenticationSession.getProjectId();
    const token = authenticationSession.getToken();
    const res = await fetch(`${API_URL}/v1/chat/conversations?projectId=${projectId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error(`Failed to create conversation: ${res.status}`);
    const conv = await res.json();
    conversationIdRef.current = conv.id;
    return conv.id;
  };

  const streamFromBackend = async (userText: string) => {
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

    try {
      abortRef.current = new AbortController();
      const conversationId = await getOrCreateConversation();
      const token = authenticationSession.getToken();

      const res = await fetch(`${API_URL}/v1/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: userText }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      let flushTimer: ReturnType<typeof setTimeout> | null = null;
      const flushText = () => {
        const captured = fullText;
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, text: captured } : m)),
        );
        flushTimer = null;
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const eventBlock of events) {
          const lines = eventBlock.split('\n');
          const eventLine = lines.find((l) => l.startsWith('event: '));
          const dataLine = lines.find((l) => l.startsWith('data: '));
          if (!eventLine || !dataLine) continue;

          const eventType = eventLine.replace('event: ', '');
          try {
            const data = JSON.parse(dataLine.replace('data: ', ''));
            if (eventType === 'content_delta' && data.text) {
              fullText += data.text;
              if (!flushTimer) {
                flushTimer = setTimeout(flushText, 50);
              }
            } else if (eventType === 'tool_call_start') {
              const displayName = (data.toolName || '').replace(/^ap_/, '').replace(/_/g, ' ');
              fullText += `\n\n> ⚙️ **${displayName}**\n\n`;
              if (!flushTimer) flushTimer = setTimeout(flushText, 50);
            } else if (eventType === 'error') {
              fullText += `\n\n> ❌ ${data.message}\n\n`;
              if (!flushTimer) flushTimer = setTimeout(flushText, 50);
            }
          } catch {
            /* skip malformed events */
          }
        }
      }

      if (flushTimer) clearTimeout(flushTimer);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, text: fullText, streaming: false } : m,
        ),
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Chat error:', err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  text: `Error: ${(err as Error).message}`,
                  streaming: false,
                }
              : m,
          ),
        );
      }
    }
    abortRef.current = null;
  };

  const regenerateResponse = async (msgId: number) => {
    // Find the last user message before this AI message
    const msgIndex = messages.findIndex((m) => m.id === msgId);
    let lastUserText = '';
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserText = messages[i].text;
        break;
      }
    }

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const prevResponses = m.responses || [m.text];
        return {
          ...m,
          text: '',
          streaming: true,
          responses: prevResponses,
          responseIndex: prevResponses.length,
        };
      }),
    );

    setTyping(true);
    setThinkingText(pickThinkingText());

    // Build history up to the user message
    const chatHistory: { role: 'user' | 'assistant'; content: string }[] =
      messages
        .slice(0, msgIndex)
        .filter((m) => m.text)
        .map((m) => ({
          role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.text,
        }));
    if (!chatHistory.length) {
      chatHistory.push({ role: 'user', content: lastUserText || 'Hello' });
    }

    try {
      abortRef.current = new AbortController();
      const conversationId = await getOrCreateConversation();
      const authToken = authenticationSession.getToken();

      const res = await fetch(`${API_URL}/v1/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: lastUserText || 'Hello' }),
        signal: abortRef.current.signal,
      });

      setTyping(false);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const eventBlock of events) {
          const eventLines = eventBlock.split('\n');
          const dataLine = eventLines.find((l) => l.startsWith('data: '));
          const eventLine = eventLines.find((l) => l.startsWith('event: '));
          if (!dataLine || !eventLine) continue;
          const eventType = eventLine.replace('event: ', '');
          try {
            const data = JSON.parse(dataLine.replace('data: ', ''));
            if (eventType === 'content_delta' && data.text) {
              fullText += data.text;
              const captured = fullText;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === msgId ? { ...m, text: captured } : m,
                ),
              );
            } else if (eventType === 'tool_call_start') {
              const displayName = (data.toolName || '').replace(/^ap_/, '').replace(/_/g, ' ');
              fullText += `\n\n> ⚙️ **${displayName}**\n\n`;
            }
          } catch {
            /* skip */
          }
        }
      }

      const finalText = fullText;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId) return m;
          const responses = [...(m.responses || []), finalText];
          return {
            ...m,
            text: finalText,
            streaming: false,
            responses,
            responseIndex: responses.length - 1,
          };
        }),
      );
    } catch {
      setTyping(false);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, streaming: false } : m)),
      );
    }
    abortRef.current = null;
  };

  const stopStreaming = () => {
    if (thinkingRef.current) {
      clearTimeout(thinkingRef.current);
      thinkingRef.current = null;
      setTyping(false);
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (streamRef.current) {
      clearInterval(streamRef.current);
      streamRef.current = null;
    }
    setMessages((prev) => prev.filter((m) => !m.streaming));
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
        const binaryExts = [
          'pdf',
          'doc',
          'docx',
          'xls',
          'xlsx',
          'ppt',
          'pptx',
          'zip',
          'rar',
          'exe',
          'dmg',
          'mp3',
          'mp4',
          'mov',
          'avi',
        ];
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (!binaryExts.includes(ext)) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const text = ev.target?.result as string;
            // Check if content looks like text (not binary garbage)
            const isBinary = text
              .slice(0, 200)
              .split('')
              .some((c) => {
                const code = c.charCodeAt(0);
                return code < 9 || (code > 13 && code < 32 && code !== 27);
              });
            attachment.src = isBinary ? '' : text;
            setPendingFiles((prev) => [...prev, attachment]);
          };
          reader.readAsText(file);
        } else {
          setPendingFiles((prev) => [...prev, attachment]);
        }
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
        const binaryExts = [
          'pdf',
          'doc',
          'docx',
          'xls',
          'xlsx',
          'ppt',
          'pptx',
          'zip',
          'rar',
          'exe',
          'dmg',
          'mp3',
          'mp4',
          'mov',
          'avi',
        ];
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (!binaryExts.includes(ext)) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const isBinary = text
              .slice(0, 200)
              .split('')
              .some((c) => {
                const code = c.charCodeAt(0);
                return code < 9 || (code > 13 && code < 32 && code !== 27);
              });
            attachment.src = isBinary ? '' : text;
            setPendingFiles((prev) => [...prev, attachment]);
          };
          reader.readAsText(file);
        } else {
          setPendingFiles((prev) => [...prev, attachment]);
        }
      }
    });
  };

  const sendMessage = () => {
    const text = input.trim();
    const hasAttachments =
      pendingImages.length > 0 ||
      pendingFiles.length > 0 ||
      replyQuotes.length > 0;
    if (
      (!text && !hasAttachments) ||
      typing ||
      messages.some((m) => m.streaming)
    )
      return;
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
    setThinkingText(pickThinkingText());

    const chatHistory: {
      role: 'user' | 'assistant';
      content:
        | string
        | Array<{
            type: string;
            text?: string;
            source?: { type: string; media_type: string; data: string };
          }>;
    }[] = messages
      .filter((m) => m.text)
      .map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

    // Build content for current message with images/files
    const hasImages = images && images.length > 0;
    const hasFiles = files && files.some((f) => f.src);
    if (hasImages || hasFiles) {
      const contentBlocks: Array<{
        type: string;
        text?: string;
        source?: { type: string; media_type: string; data: string };
      }> = [];
      if (images) {
        for (const img of images) {
          const match = img.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            contentBlocks.push({
              type: 'image',
              source: { type: 'base64', media_type: match[1], data: match[2] },
            });
          }
        }
      }
      if (files) {
        for (const f of files) {
          if (f.src) {
            contentBlocks.push({
              type: 'text',
              text: `--- File: ${f.name} ---\n${f.src}`,
            });
          }
        }
      }
      if (fullText) contentBlocks.push({ type: 'text', text: fullText });
      chatHistory.push({ role: 'user', content: contentBlocks });
    } else {
      chatHistory.push({ role: 'user', content: fullText });
    }

    const userText = fullText || (files ? files[0].name : 'Hello');
    thinkingRef.current = setTimeout(async () => {
      thinkingRef.current = null;
      setTyping(false);
      await streamFromBackend(userText);
    }, 500);
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
  const canSend =
    (!!input.trim() ||
      pendingImages.length > 0 ||
      pendingFiles.length > 0 ||
      replyQuotes.length > 0) &&
    !typing &&
    !isStreaming;

  const promptBox = (
    <div
      className="w-full mx-auto"
      style={{ maxWidth: 'clamp(280px, calc(100vw - 700px), 560px)' }}
    >
      <div className="prompt-box flex flex-col rounded-2xl p-0">
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
            className="flex gap-2 pt-3 px-3 flex-nowrap items-end overflow-x-auto overflow-y-hidden cursor-grab"
            style={{ scrollbarWidth: 'none' }}
          >
            {pendingImages.map((src, i) => (
              <div
                key={'img-' + i}
                className="img-preview-wrap flex shrink-0 select-none"
              >
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className="h-[52px] rounded-lg object-cover block border border-border"
                  style={{
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
                className="file-chip-pending shrink-0 select-none"
              >
                <div className="file-chip">
                  {(() => {
                    const Icon = FILE_ICON_MAP[file.type];
                    return (
                      <Icon
                        size={20}
                        className="text-muted-foreground shrink-0"
                      />
                    );
                  })()}
                  <div className="min-w-0">
                    <div className="text-xs font-medium overflow-hidden text-ellipsis whitespace-nowrap text-foreground">
                      {file.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
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
                className="reply-quote shrink-0 select-none"
              >
                <Reply size={10} className="shrink-0 text-muted-foreground" />
                <span
                  className="text-foreground overflow-hidden line-clamp-3 max-w-full break-words"
                  style={{
                    fontSize:
                      quote.text.length > 80
                        ? '7px'
                        : quote.text.length > 40
                        ? '8px'
                        : '9px',
                    lineHeight: 1.3,
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
          className="w-full bg-transparent border-none text-accent-foreground dark:text-neutral-300 text-base leading-relaxed resize-none max-h-[140px] font-inherit outline-none box-border p-3"
        />
        <div className="flex justify-between items-center p-2">
          <div className="relative">
            <button
              className={cn(
                'plus-btn w-[30px] h-[30px] rounded-lg border-none bg-transparent cursor-pointer flex items-center justify-center text-muted-foreground transition-colors',
                plusMenuOpen && 'open',
              )}
              onClick={() => setPlusMenuOpen(!plusMenuOpen)}
            >
              <Plus size={18} strokeWidth={2.2} />
            </button>
            {plusMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-[19]"
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
                    <Paperclip size={16} />
                    Upload files or images
                  </button>
                  <button
                    className="plus-menu-item"
                    onClick={() => setPlusMenuOpen(false)}
                  >
                    <svg
                      width="16"
                      height="16"
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
          <div className="flex items-center gap-1.5">
            <DropdownMenu open={modelMenuOpen} onOpenChange={setModelMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-[30px] px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  {selectedModel}
                  <ChevronDown
                    size={12}
                    className={cn(
                      'transition-transform duration-150',
                      modelMenuOpen && 'rotate-180',
                    )}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="top"
                className="min-w-[200px]"
              >
                {[
                  {
                    name: 'GPT-4o',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path
                          d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
                          fill="currentColor"
                        />
                      </svg>
                    ),
                  },
                  {
                    name: 'GPT-4o mini',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path
                          d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
                          fill="currentColor"
                        />
                      </svg>
                    ),
                  },
                  {
                    name: 'Claude Sonnet',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24">
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
                      <svg width="16" height="16" viewBox="0 0 24 24">
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
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path
                          d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"
                          fill="#4285F4"
                        />
                      </svg>
                    ),
                  },
                ].map(({ name, icon }) => (
                  <DropdownMenuItem
                    key={name}
                    className="gap-2 justify-between"
                    onClick={() => setSelectedModel(name)}
                  >
                    <span className="flex items-center gap-2">
                      {icon}
                      {name}
                    </span>
                    {selectedModel === name && (
                      <Check size={14} strokeWidth={2.5} />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {isStreaming || typing ? (
              <Button
                variant="ghost"
                size="sm"
                className="send-btn send-btn-active flex items-center gap-1.5 h-[30px] px-3 rounded-lg border-none cursor-pointer shrink-0 hover:bg-transparent"
                onClick={stopStreaming}
              >
                <Square size={11} className="text-white fill-white" />
                <span className="text-white text-xs font-medium">Stop</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn(
                  'send-btn w-[30px] h-[30px] rounded-lg border-none shrink-0 hover:bg-transparent',
                  canSend
                    ? 'send-btn-active cursor-pointer'
                    : 'send-btn-disabled cursor-default',
                )}
                onClick={sendMessage}
                disabled={!canSend}
              >
                <ArrowUp
                  size={15}
                  strokeWidth={2.5}
                  className={canSend ? 'text-white' : 'text-muted-foreground'}
                />
              </Button>
            )}
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
        className="flex flex-col h-full relative"
      >
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-8 px-6">
            <h2
              className="text-[32px] font-bold m-0 text-center text-foreground w-full"
              style={{
                fontFamily: '"Sentient", serif',
                maxWidth: 'clamp(260px, calc(100vw - 730px), 530px)',
                textWrap: 'balance',
                lineHeight: 1.2,
              }}
            >
              {incognito ? (
                <>Private Chat</>
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
                className="text-xl text-muted-foreground text-center"
                style={{
                  fontFamily: '"Sentient", serif',
                  margin: '-16px 0 0',
                }}
              >
                This chat won&apos;t appear in your chat history.
              </p>
            )}
            <div className="w-full">{promptBox}</div>
            {!incognito && (
              <div
                className="w-full grid gap-2.5"
                style={{
                  maxWidth: 'clamp(260px, calc(100vw - 730px), 530px)',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                }}
              >
                {[
                  { text: 'Summarize a document for me', Icon: FileText },
                  { text: 'Help me write an automation flow', Icon: Zap },
                  { text: 'What integrations do you support?', Icon: Plug },
                  { text: 'How do I connect two apps?', Icon: Link },
                ].map((item) => (
                  <button
                    key={item.text}
                    className="suggest-chip hover:bg-muted"
                    onClick={() => {
                      setInput(item.text);
                      textareaRef.current?.focus();
                    }}
                  >
                    <span className="suggest-icon">
                      <item.Icon size={14} />
                    </span>
                    <span>{item.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div
              className="msgs-area flex-1 overflow-y-auto pt-6 flex flex-col"
              style={{ scrollbarGutter: 'stable', overflowAnchor: 'auto' }}
            >
              <div
                className="w-full mx-auto pb-10 px-4 flex flex-col gap-4"
                style={{ maxWidth: 'clamp(320px, calc(100vw - 580px), 720px)' }}
              >
                {messages.map((msg, msgIdx) => {
                  const isLastAiMsg =
                    msg.role === 'ai' && msgIdx === messages.length - 1;
                  return msg.role === 'ai' ? (
                    <div
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      className="ai-msg msg-enter py-2"
                      onMouseUp={handleTextSelect}
                    >
                      {msg.images && msg.images.length > 0 && (
                        <div className="mb-2">
                          {imgProgress[msg.id] !== undefined &&
                            imgProgress[msg.id] < 100 && (
                              <span className="img-gen-label text-base font-medium mb-2 inline-block select-none">
                                Generating image...
                              </span>
                            )}
                          <div className="flex gap-1.5 flex-wrap">
                            {msg.images.map((src, i) => (
                              <div key={i} className="relative">
                                <img
                                  src={src}
                                  alt="Generated image"
                                  referrerPolicy="no-referrer"
                                  className="chat-img rounded-xl object-cover block bg-muted"
                                  style={{
                                    width: 400,
                                    height: 400,
                                    maxWidth: '100%',
                                  }}
                                  onClick={() => setLightboxSrc(src)}
                                  onLoad={() => finishImgProgress(msg.id)}
                                  onError={() => finishImgProgress(msg.id)}
                                />
                                {imgProgress[msg.id] !== undefined &&
                                  imgProgress[msg.id] < 100 && (
                                    <div className="absolute inset-0 rounded-xl img-shimmer z-10" />
                                  )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {msg.streaming ? (
                        <ApMarkdown
                          markdown={msg.text}
                          variant={MarkdownVariant.BORDERLESS}
                          className="text-base leading-relaxed text-accent-foreground dark:text-neutral-300 prose prose-sm max-w-none"
                        />
                      ) : (
                        <ApMarkdown
                          markdown={msg.text}
                          variant={MarkdownVariant.BORDERLESS}
                          className="text-base leading-relaxed text-accent-foreground dark:text-neutral-300 prose prose-sm max-w-none"
                        />
                      )}
                      {msg.streaming && msg.text && (
                        <div className="mt-3" style={{ width: 40, height: 40 }}>
                          <Lottie
                            options={{
                              loop: true,
                              autoplay: true,
                              animationData: thinkingLoaderData,
                              rendererSettings: {
                                preserveAspectRatio: 'xMidYMid slice',
                              },
                            }}
                            height={40}
                            width={40}
                            isClickToPauseDisabled={true}
                          />
                        </div>
                      )}
                      {!msg.streaming && msg.text && (
                        <div
                          className={cn(
                            'flex items-center gap-1.5 mt-1.5',
                            !isLastAiMsg && 'ai-msg-actions',
                          )}
                        >
                          {msg.responses && msg.responses.length > 1 && (
                            <div className="flex items-center gap-0.5">
                              <DelayedTooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-muted-foreground hover:text-foreground"
                                    disabled={
                                      msg.responseIndex === undefined ||
                                      msg.responseIndex <= 0
                                    }
                                    onClick={() => {
                                      const newIdx =
                                        (msg.responseIndex ?? 0) - 1;
                                      setMessages((prev) =>
                                        prev.map((m) =>
                                          m.id === msg.id
                                            ? {
                                                ...m,
                                                text: m.responses![newIdx],
                                                responseIndex: newIdx,
                                              }
                                            : m,
                                        ),
                                      );
                                    }}
                                  >
                                    <ChevronLeft size={16} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="bottom"
                                  className="pointer-events-none"
                                >
                                  Previous
                                </TooltipContent>
                              </DelayedTooltip>
                              <span className="text-sm text-muted-foreground tabular-nums select-none">
                                {(msg.responseIndex ?? 0) + 1}/
                                {msg.responses.length}
                              </span>
                              <DelayedTooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-muted-foreground hover:text-foreground"
                                    disabled={
                                      msg.responseIndex === undefined ||
                                      msg.responseIndex >=
                                        msg.responses.length - 1
                                    }
                                    onClick={() => {
                                      const newIdx =
                                        (msg.responseIndex ?? 0) + 1;
                                      setMessages((prev) =>
                                        prev.map((m) =>
                                          m.id === msg.id
                                            ? {
                                                ...m,
                                                text: m.responses![newIdx],
                                                responseIndex: newIdx,
                                              }
                                            : m,
                                        ),
                                      );
                                    }}
                                  >
                                    <ChevronRight size={16} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="bottom"
                                  className="pointer-events-none"
                                >
                                  Next
                                </TooltipContent>
                              </DelayedTooltip>
                            </div>
                          )}
                          <DelayedTooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.text);
                                  setCopiedId(msg.id);
                                  setTimeout(() => setCopiedId(null), 1500);
                                }}
                              >
                                {copiedId === msg.id ? (
                                  <Check size={16} strokeWidth={2.5} />
                                ) : (
                                  <Copy size={16} />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              className="pointer-events-none"
                            >
                              {copiedId === msg.id ? 'Copied!' : 'Copy'}
                            </TooltipContent>
                          </DelayedTooltip>
                          <DelayedTooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => regenerateResponse(msg.id)}
                              >
                                <RefreshCw size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              className="pointer-events-none"
                            >
                              <div className="text-center">
                                <div>Try again</div>
                                <div className="text-xs text-ring">
                                  {selectedModel}
                                </div>
                              </div>
                            </TooltipContent>
                          </DelayedTooltip>
                          {(() => {
                            const { count, favicons } = getMockSources(msg.id);
                            return (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-muted hover:bg-accent text-muted-foreground text-xs font-medium"
                                onClick={() => {
                                  /* TODO: expand sources */
                                }}
                              >
                                <div className="flex items-center -space-x-1">
                                  {favicons.map((src, i) => (
                                    <img
                                      key={i}
                                      src={src}
                                      alt=""
                                      className="w-3.5 h-3.5 rounded-full ring-1 ring-muted bg-background object-contain"
                                    />
                                  ))}
                                </div>
                                <span>{count} sources</span>
                              </Button>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      key={msg.id}
                      className="msg-enter user-msg-wrap flex justify-end py-1"
                    >
                      <div className="max-w-[75%] w-fit ml-auto">
                        {msg.images && msg.images.length > 0 && (
                          <div
                            className={cn(
                              'flex gap-1.5 flex-wrap justify-end',
                              msg.text && 'mb-1.5',
                            )}
                          >
                            {msg.images.map((src, i) => (
                              <img
                                key={i}
                                src={src}
                                alt=""
                                className="chat-img max-w-[200px] max-h-[150px] rounded-xl object-cover block"
                                onClick={() => setLightboxSrc(src)}
                              />
                            ))}
                          </div>
                        )}
                        {msg.files && msg.files.length > 0 && (
                          <div
                            className={cn(
                              'flex gap-1.5 flex-wrap justify-end',
                              msg.text && 'mb-1.5',
                            )}
                          >
                            {msg.files.map((file, i) => (
                              <div key={i} className="file-chip">
                                {(() => {
                                  const Icon = FILE_ICON_MAP[file.type];
                                  return (
                                    <Icon
                                      size={18}
                                      className="text-muted-foreground shrink-0"
                                    />
                                  );
                                })()}
                                <div className="min-w-0">
                                  <div className="text-xs font-medium overflow-hidden text-ellipsis whitespace-nowrap text-foreground">
                                    {file.name}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {file.size}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.quotes && msg.quotes.length > 0 && (
                          <div
                            className={cn(
                              'flex gap-1.5 flex-wrap justify-end',
                              msg.text && 'mb-1.5',
                            )}
                          >
                            {msg.quotes.map((quote, i) => (
                              <div
                                key={i}
                                className="reply-quote select-none cursor-pointer"
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
                                  // First, create the highlight mark so we can scroll to it
                                  const walker = document.createTreeWalker(
                                    el,
                                    NodeFilter.SHOW_TEXT,
                                  );
                                  let node: Text | null;
                                  let mark: HTMLElement | null = null;
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
                                    mark = document.createElement('mark');
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
                                      mark!.style.background = 'transparent';
                                    }, 3000);
                                    setTimeout(() => {
                                      const parent = mark!.parentNode;
                                      if (parent) {
                                        parent.replaceChild(
                                          document.createTextNode(
                                            mark!.textContent || '',
                                          ),
                                          mark!,
                                        );
                                        parent.normalize();
                                      }
                                    }, 3500);
                                    break;
                                  }
                                  // Scroll to the highlighted text (not the message container)
                                  const scrollTarget = mark || el;
                                  const scrollContainer =
                                    el.closest('.msgs-area');
                                  if (scrollContainer) {
                                    const containerRect =
                                      scrollContainer.getBoundingClientRect();
                                    const targetRect =
                                      scrollTarget.getBoundingClientRect();
                                    const isVisible =
                                      targetRect.top >= containerRect.top &&
                                      targetRect.bottom <= containerRect.bottom;
                                    if (!isVisible) {
                                      const containerCenter =
                                        containerRect.top +
                                        containerRect.height / 2;
                                      const targetCenter =
                                        targetRect.top + targetRect.height / 2;
                                      scrollContainer.scrollBy({
                                        top: targetCenter - containerCenter,
                                        behavior: 'smooth',
                                      });
                                    }
                                  }
                                }}
                              >
                                <Reply
                                  size={10}
                                  className="shrink-0 text-muted-foreground"
                                />
                                <span
                                  className="text-foreground overflow-hidden line-clamp-3 max-w-full break-words"
                                  style={{
                                    fontSize:
                                      quote.text.length > 80
                                        ? '7px'
                                        : quote.text.length > 40
                                        ? '8px'
                                        : '9px',
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {quote.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.text && (
                          <div className="bg-muted text-accent-foreground dark:text-neutral-300 px-4 py-2.5 rounded-[18px_18px_4px_18px] text-base leading-relaxed whitespace-pre-wrap break-words overflow-wrap-break-word w-fit ml-auto">
                            {msg.text}
                          </div>
                        )}
                        <div className="msg-meta flex items-center justify-end gap-1.5 mt-1">
                          <DelayedTooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-muted-foreground cursor-default">
                                {msg.time}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              className="pointer-events-none"
                            >
                              {msg.fullDate}
                            </TooltipContent>
                          </DelayedTooltip>
                          {msg.text && (
                            <DelayedTooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    navigator.clipboard.writeText(msg.text);
                                    setCopiedId(msg.id);
                                    setTimeout(() => setCopiedId(null), 1500);
                                  }}
                                >
                                  {copiedId === msg.id ? (
                                    <Check size={16} strokeWidth={2.5} />
                                  ) : (
                                    <Copy size={16} />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="bottom"
                                className="pointer-events-none"
                              >
                                {copiedId === msg.id ? 'Copied!' : 'Copy'}
                              </TooltipContent>
                            </DelayedTooltip>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(typing || messages.some((m) => m.streaming && !m.text)) && (
                  <div className="msg-enter py-2">
                    <div className="flex gap-1 items-center">
                      <div
                        className="shrink-0"
                        style={{ width: 28, height: 28 }}
                      >
                        <Lottie
                          options={{
                            loop: true,
                            autoplay: true,
                            animationData: thinkingLoaderData,
                            rendererSettings: {
                              preserveAspectRatio: 'xMidYMid slice',
                            },
                          }}
                          height={28}
                          width={28}
                          isClickToPauseDisabled={true}
                        />
                      </div>
                      <span className="thinking-label text-base font-medium">
                        {thinkingText}
                      </span>
                    </div>
                  </div>
                )}
                <div className="h-[200px] shrink-0" />
                <div ref={bottomRef} />
              </div>
            </div>
            <div className="prompt-float absolute bottom-0 left-0 right-0 flex flex-col items-center pointer-events-none">
              <div className="prompt-float-inner pointer-events-auto">
                {promptBox}
              </div>
              <div className="prompt-float-footer pointer-events-auto">
                <p className="text-center text-[12px] py-1.5 pb-3">
                  <a
                    href="https://www.activepieces.com/product/ai-adoption"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground no-underline transition-colors hover:text-foreground"
                  >
                    Activepieces AI can help you automate anything.
                  </a>
                </p>
              </div>
            </div>
          </>
        )}
        {isDragging && (
          <div className="drop-overlay">
            <div className="flex flex-col items-center gap-2">
              <img
                src={dropMediaImg}
                alt=""
                className="w-[120px] h-[120px] object-contain"
              />
              <span className="text-base font-bold text-foreground">
                Add anything
              </span>
              <span className="text-sm text-foreground">
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
              <Reply size={14} className="-scale-x-100" />
            </button>
          </div>,
          document.body,
        )}
      {lightboxSrc && (
        <div className="lightbox" onClick={() => setLightboxSrc(null)}>
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/15 border-none cursor-pointer flex items-center justify-center text-white transition-colors hover:bg-white/25"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
          <img
            src={lightboxSrc}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="cursor-default"
          />
        </div>
      )}
    </>
  );
}
