import { Archive, ChevronDown, Plus, RotateCcw } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

import { TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { DelayedTooltip } from './delayed-tooltip';

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
  .conv-item { display: flex; align-items: center; padding: 4px 12px; border-radius: 6px; cursor: pointer; transition: background 0.15s; border: none; background: transparent; width: 100%; text-align: left; font-family: inherit; color: var(--foreground); outline: none !important; box-shadow: none; position: relative; }
  .conv-item .archive-btn { opacity: 0; position: absolute; right: 1px; top: 50%; transform: translateY(-50%); background: transparent; border: none; cursor: pointer; padding: 4px; border-radius: 6px; color: var(--muted-foreground); transition: opacity 0.15s, color 0.15s, background 0.15s; outline: none !important; }
  .conv-item:hover .archive-btn { opacity: 1; }
  .conv-item .archive-btn:hover { color: var(--foreground); background: rgba(0,0,0,0.08); }
  .dark .conv-item .archive-btn:hover { color: var(--foreground); background: rgba(255,255,255,0.1); }
  .conv-item:focus { outline: none !important; box-shadow: none !important; }
  .conv-item:focus-visible { box-shadow: 0 0 0 2px var(--sidebar-ring) !important; }
  .conv-item:hover { background: rgba(0,0,0,0.05); }
  .dark .conv-item:hover { background: rgba(255,255,255,0.07); }
  .conv-item.active { background: rgba(0,0,0,0.08); font-weight: 600; }
  .dark .conv-item.active { background: rgba(255,255,255,0.1); font-weight: 600; }
  .conv-list { scrollbar-width: none; }
  .conv-list::-webkit-scrollbar { width: 0; }
  .conv-list:hover { scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--muted-foreground) 20%, transparent) transparent; }
  .conv-list:hover::-webkit-scrollbar { width: 4px; }
  .conv-list:hover::-webkit-scrollbar-track { background: transparent; }
  .conv-list:hover::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--muted-foreground) 20%, transparent); border-radius: 4px; }
  .conv-fade-top { background: linear-gradient(to bottom, var(--background), transparent); }
  .conv-fade-bottom { background: linear-gradient(to top, var(--background), transparent); }
  .conv-sidebar { background: transparent !important; opacity: 0.4; transition: opacity 0.2s; }
  .conv-sidebar:hover { opacity: 1; }
`;

export function ConversationList({
  onSelect,
  newChat,
  onNewChat,
}: {
  onSelect?: (id: string) => void;
  newChat?: { title: string; key: number } | null;
  onNewChat?: () => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [extraConvs, setExtraConvs] = useState<Conversation[]>([]);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const groups = ['Today', 'Yesterday', 'Older', 'Archived'];
    const state: Record<string, boolean> = {};
    let firstOpened = false;
    const allItems = [...FAKE_CONVERSATIONS];
    const todayItems = allItems.filter((c) => isToday(c.date));
    const yesterdayItems = allItems.filter((c) => isYesterday(c.date));
    const olderItems = allItems.filter(
      (c) => !isToday(c.date) && !isYesterday(c.date),
    );
    const counts: Record<string, number> = {
      Today: todayItems.length,
      Yesterday: yesterdayItems.length,
      Older: olderItems.length,
      Archived: 0,
    };
    for (const g of groups) {
      if (!firstOpened && counts[g] > 0) {
        state[g] = false;
        firstOpened = true;
      } else {
        state[g] = true;
      }
    }
    return state;
  });
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const checkFades = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setShowTopFade(el.scrollTop > 5);
    setShowBottomFade(el.scrollTop + el.clientHeight < el.scrollHeight - 5);
  }, []);

  useEffect(() => {
    checkFades();
  }, [collapsed, checkFades]);

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

  const allItems = [...extraConvs, ...FAKE_CONVERSATIONS];
  const allConversations = allItems.filter((c) => !archivedIds.has(c.id));
  const archivedList = allItems.filter((c) => archivedIds.has(c.id));
  const today = allConversations.filter((c) => isToday(c.date));
  const yesterdayList = allConversations.filter((c) => isYesterday(c.date));
  const olderList = allConversations.filter(
    (c) => !isToday(c.date) && !isYesterday(c.date),
  );

  const handleClick = (id: string) => {
    setActiveId(id);
    onSelect?.(id);
  };

  const handleArchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setArchivedIds((prev) => new Set(prev).add(id));
    if (activeId === id) setActiveId(null);
    toast('Conversation archived.', { duration: 2500 });
  };

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleUnarchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setArchivedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast('Conversation restored.', { duration: 2500 });
  };

  const renderGroup = (label: string, items: Conversation[]) => {
    if (items.length === 0) return null;
    const isCollapsed = collapsed[label];
    const isArchived = label === 'Archived';
    return (
      <div className="mb-2 flex flex-col gap-0.5">
        <button
          className="flex items-center gap-0.5 rounded-md bg-transparent border-none cursor-pointer font-inherit text-[11px] font-semibold px-3 py-1 m-0 uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground outline-none! focus:outline-none! focus:shadow-none! focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          onClick={() => toggleGroup(label)}
        >
          {label}
          <ChevronDown
            size={10}
            className={cn(
              'shrink-0 transition-transform duration-150',
              isCollapsed && '-rotate-90',
            )}
          />
        </button>
        {!isCollapsed &&
          items.map((conv) => (
            <button
              key={conv.id}
              className={`conv-item ${activeId === conv.id ? 'active' : ''}`}
              onClick={() => handleClick(conv.id)}
            >
              <span
                className={cn(
                  'text-xs overflow-hidden text-ellipsis whitespace-nowrap pr-[18px]',
                  isArchived && 'opacity-50',
                )}
              >
                {streamingId === conv.id ? streamingText : conv.title}
              </span>
              <DelayedTooltip>
                <TooltipTrigger asChild>
                  <span
                    className="archive-btn"
                    onClick={(e) =>
                      isArchived
                        ? handleUnarchive(e, conv.id)
                        : handleArchive(e, conv.id)
                    }
                  >
                    {isArchived ? (
                      <RotateCcw size={14} />
                    ) : (
                      <Archive size={14} />
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="center"
                  className="pointer-events-none"
                >
                  {isArchived ? 'Restore' : 'Archive'}
                </TooltipContent>
              </DelayedTooltip>
            </button>
          ))}
      </div>
    );
  };

  return (
    <>
      <style>{css}</style>
      <div
        className="conv-sidebar flex flex-col h-full shrink-0 bg-transparent pl-2"
        style={{ width: 'min(210px, 25vw)' }}
      >
        <div className="px-3 pt-3 pb-2">
          <button
            className="flex items-center justify-between gap-1.5 w-full px-2 py-1.5 rounded-md border border-border bg-transparent cursor-pointer font-inherit text-xs text-foreground transition-colors hover:bg-accent outline-none! focus:outline-none! focus:shadow-none! focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            onClick={() => {
              setActiveId(null);
              onNewChat?.();
            }}
          >
            <span className="flex items-center gap-1.5">
              <Plus size={14} />
              New chat
            </span>
            <span className="text-[11px] opacity-50">⇧⌘O</span>
          </button>
        </div>
        <div className="flex-1 relative min-h-0">
          {showTopFade && (
            <div className="conv-fade-top absolute top-0 left-0 right-0 h-5 pointer-events-none z-[1]" />
          )}
          <div
            ref={listRef}
            onScroll={checkFades}
            className="conv-list h-full overflow-y-scroll px-2 pb-3"
          >
            {renderGroup('Today', today)}
            {renderGroup('Yesterday', yesterdayList)}
            {renderGroup('Older', olderList)}
            {renderGroup('Archived', archivedList)}
          </div>
          {showBottomFade && (
            <div className="conv-fade-bottom absolute bottom-0 left-0 right-0 h-[70px] pointer-events-none z-[1]" />
          )}
        </div>
      </div>
    </>
  );
}
