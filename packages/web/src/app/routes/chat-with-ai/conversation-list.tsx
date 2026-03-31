import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

type Conversation = {
  id: string;
  title: string;
  date: Date;
};

const now = new Date();
const yesterday = new Date(now);
yesterday.setDate(yesterday.getDate() - 1);
const older = new Date(now);
older.setDate(older.getDate() - 5);

const FAKE_CONVERSATIONS: Conversation[] = [
  { id: '1', title: 'How to connect Google Sheets', date: new Date() },
  { id: '2', title: 'Automate email notifications', date: new Date() },
  { id: '3', title: 'Build a Slack bot workflow', date: yesterday },
  { id: '4', title: 'Schedule recurring tasks', date: yesterday },
  { id: '21', title: 'Zapier migration guide', date: yesterday },
  { id: '22', title: 'Error handling patterns', date: yesterday },
  { id: '23', title: 'OAuth setup walkthrough', date: yesterday },
  { id: '24', title: 'Multi-step flow design', date: yesterday },
  { id: '25', title: 'Conditional branching help', date: yesterday },
  { id: '5', title: 'Webhook trigger setup', date: older },
  { id: '6', title: 'Data transformation help', date: older },
  { id: '7', title: 'API integration questions', date: older },
  { id: '8', title: 'Connect Stripe payments', date: older },
  { id: '9', title: 'Discord bot automation', date: older },
  { id: '10', title: 'CSV file processing', date: older },
  { id: '11', title: 'Email parser workflow', date: older },
  { id: '12', title: 'Google Drive sync setup', date: older },
  { id: '13', title: 'Notion database trigger', date: older },
  { id: '14', title: 'Slack notification flow', date: older },
  { id: '15', title: 'Airtable integration help', date: older },
  { id: '16', title: 'HTTP request debugging', date: older },
  { id: '17', title: 'Scheduling cron jobs', date: older },
  { id: '18', title: 'Form submission handler', date: older },
  { id: '19', title: 'Twitter API automation', date: older },
  { id: '20', title: 'Database backup workflow', date: older },
];

function isToday(date: Date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isYesterday(date: Date) {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return date.toDateString() === y.toDateString();
}

const css = `
  .conv-item { display: flex; align-items: center; padding: 4px 8px; border-radius: 6px; cursor: pointer; transition: background 0.15s; border: none; background: transparent; width: 100%; text-align: left; font-family: inherit; color: hsl(var(--foreground)); outline: none !important; box-shadow: none; position: relative; }
  .conv-item .archive-btn { opacity: 0; position: absolute; right: 4px; top: 50%; transform: translateY(-50%); background: transparent; border: none; cursor: pointer; padding: 4px; border-radius: 6px; color: #a3a3a3; transition: opacity 0.15s, color 0.15s, background 0.15s; outline: none !important; }
  .conv-item:hover .archive-btn { opacity: 1; }
  .conv-item .archive-btn:hover { color: #404040; background: rgba(0,0,0,0.08); }
  .dark .conv-item .archive-btn:hover { color: #d4d4d4; background: rgba(255,255,255,0.1); }
  .conv-item:focus { outline: none !important; box-shadow: none !important; }
  .conv-item:focus-visible { box-shadow: 0 0 0 2px hsl(var(--sidebar-ring)) !important; }
  .conv-item:hover { background: rgba(0,0,0,0.05); }
  .dark .conv-item:hover { background: rgba(255,255,255,0.07); }
  .conv-item.active { background: rgba(0,0,0,0.08); font-weight: 600; }
  .dark .conv-item.active { background: rgba(255,255,255,0.1); font-weight: 600; }
  .conv-list { scrollbar-width: none; }
  .conv-list::-webkit-scrollbar { width: 0; }
  .conv-list:hover { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.15) transparent; }
  .conv-list:hover::-webkit-scrollbar { width: 4px; }
  .conv-list:hover::-webkit-scrollbar-track { background: transparent; }
  .conv-list:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
  .dark .conv-list:hover { scrollbar-color: rgba(255,255,255,0.2) transparent; }
  .dark .conv-list:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
  .conv-fade-top { background: linear-gradient(to bottom, rgba(255,255,255,1), transparent); }
  .dark .conv-fade-top { background: linear-gradient(to bottom, rgba(9,9,11,1), transparent); }
  .conv-fade-bottom { background: linear-gradient(to top, rgba(255,255,255,1), transparent); }
  .dark .conv-fade-bottom { background: linear-gradient(to top, rgba(9,9,11,1), transparent); }
  .conv-sidebar { background: transparent !important; opacity: 0.4; transition: opacity 0.2s; }
  .conv-sidebar:hover { opacity: 1; }
  .dark .conv-sidebar { background: transparent !important; }
  .new-chat-btn { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 6px; border: 1px solid #d4d4d4; background: transparent; cursor: pointer; font-family: inherit; font-size: 12px; color: #404040; transition: background 0.15s; width: 100%; outline: none !important; }
  .new-chat-btn:focus { outline: none !important; box-shadow: none !important; }
  .new-chat-btn:focus-visible { box-shadow: 0 0 0 2px hsl(var(--sidebar-ring)) !important; }
  .new-chat-btn:hover { background: #f5f5f5; }
  .dark .new-chat-btn { border-color: #525252; color: #d4d4d4; }
  .dark .new-chat-btn:hover { background: #262626; }
  .group-label { color: #a3a3a3; transition: color 0.15s, background 0.15s; border-radius: 6px; outline: none !important; }
  .group-label:focus { outline: none !important; box-shadow: none !important; }
  .group-label:focus-visible { box-shadow: 0 0 0 2px hsl(var(--sidebar-ring)) !important; }
  .group-label:hover { color: hsl(var(--foreground)); background: rgba(0,0,0,0.08); }
  .dark .group-label:hover { color: #fff; background: rgba(255,255,255,0.12); }
`;

export function ConversationList({ onSelect, newChat, onNewChat }: { onSelect?: (id: string) => void; newChat?: { title: string; key: number } | null; onNewChat?: () => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [extraConvs, setExtraConvs] = useState<Conversation[]>([]);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ Older: true });
  const [archiveTip, setArchiveTip] = useState<{ x: number; y: number } | null>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const checkFades = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setShowTopFade(el.scrollTop > 5);
    setShowBottomFade(el.scrollTop + el.clientHeight < el.scrollHeight - 5);
  }, []);

  useEffect(() => { checkFades(); }, [collapsed, checkFades]);

  const lastKeyRef = useRef<number | undefined>(undefined);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (newChat && newChat.key !== lastKeyRef.current) {
      lastKeyRef.current = newChat.key;
      const id = 'new-' + Date.now();
      const title = newChat.title;
      const newConv: Conversation = { id, title, date: new Date() };

      delayRef.current = setTimeout(() => {
        setExtraConvs((prev) => [newConv, ...prev]);
        setActiveId(id);
        setStreamingId(id);
        setStreamingText('');

        if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
        let i = 0;
        streamIntervalRef.current = setInterval(() => {
          i++;
          setStreamingText(title.slice(0, i));
          if (i >= title.length) {
            clearInterval(streamIntervalRef.current!);
            streamIntervalRef.current = null;
            setStreamingId(null);
          }
        }, 30);
      }, 800);
    }
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      if (delayRef.current) clearTimeout(delayRef.current);
    };
  }, [newChat]);

  const allConversations = [...extraConvs, ...FAKE_CONVERSATIONS].filter((c) => !archivedIds.has(c.id));
  const today = allConversations.filter((c) => isToday(c.date));
  const yesterdayList = allConversations.filter((c) => isYesterday(c.date));
  const olderList = allConversations.filter((c) => !isToday(c.date) && !isYesterday(c.date));

  const handleClick = (id: string) => {
    setActiveId(id);
    onSelect?.(id);
  };

  const handleArchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setArchivedIds((prev) => new Set(prev).add(id));
    setArchiveTip(null);
    if (activeId === id) setActiveId(null);
    toast('Conversation archived.', { duration: 2500 });
  };

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderGroup = (label: string, items: Conversation[]) => {
    if (items.length === 0) return null;
    const isCollapsed = collapsed[label];
    return (
      <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <button
          className="group-label"
          onClick={() => toggleGroup(label)}
          style={{
            fontSize: '11px', fontWeight: 600,
            padding: '4px 8px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px',
            background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '2px', fontFamily: 'inherit',
          }}
        >
          {label}
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none"
            style={{ transition: 'transform 0.15s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', flexShrink: 0 }}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {!isCollapsed && items.map((conv) => (
          <button
            key={conv.id}
            className={`conv-item ${activeId === conv.id ? 'active' : ''}`}
            onClick={() => handleClick(conv.id)}
          >
            <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '18px' }}>
              {streamingId === conv.id ? streamingText : conv.title}
            </span>
            <span
              className="archive-btn"
              onClick={(e) => handleArchive(e, conv.id)}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setArchiveTip({ x: rect.left + rect.width / 2, y: rect.bottom + 6 });
              }}
              onMouseLeave={() => setArchiveTip(null)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="5" rx="1"/>
                <path d="M4 8v11a2 2 0 002 2h12a2 2 0 002-2V8"/>
                <path d="M10 12h4"/>
              </svg>
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <style>{css}</style>
      <div className="conv-sidebar" style={{ width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent' }}>
        <div style={{ padding: '12px 8px 8px' }}>
          <button className="new-chat-btn" style={{ justifyContent: 'space-between' }} onClick={() => { setActiveId(null); onNewChat?.(); }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              New chat
            </span>
            <span style={{ fontSize: '11px', opacity: 0.5 }}>⇧⌘O</span>
          </button>
        </div>
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          {showTopFade && <div className="conv-fade-top" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20px', pointerEvents: 'none', zIndex: 1 }} />}
          <div ref={listRef} onScroll={checkFades} className="conv-list" style={{ height: '100%', overflowY: 'scroll', padding: '0 8px 12px' }}>
            {renderGroup('Today', today)}
            {renderGroup('Yesterday', yesterdayList)}
            {renderGroup('Older', olderList)}
          </div>
          {showBottomFade && <div className="conv-fade-bottom" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70px', pointerEvents: 'none', zIndex: 1 }} />}
        </div>
      </div>
      {archiveTip && createPortal(
        <div style={{
          position: 'fixed', left: archiveTip.x, top: archiveTip.y,
          transform: 'translateX(-50%)', padding: '4px 8px', borderRadius: '4px',
          fontSize: '12px', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 9999,
          background: '#262626', color: '#e5e5e5',
        }}>Archive</div>,
        document.body
      )}
    </>
  );
}
