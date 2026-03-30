import { useState } from 'react';

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
  { id: '5', title: 'Webhook trigger setup', date: older },
  { id: '6', title: 'Data transformation help', date: older },
  { id: '7', title: 'API integration questions', date: older },
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
  .conv-item { display: flex; align-items: center; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: background 0.15s; border: none; background: transparent; width: 100%; text-align: left; font-family: inherit; color: hsl(var(--foreground)); }
  .conv-item:hover { background: rgba(0,0,0,0.05); }
  .dark .conv-item:hover { background: rgba(255,255,255,0.07); }
  .conv-item.active { background: rgba(0,0,0,0.08); }
  .dark .conv-item.active { background: rgba(255,255,255,0.1); }
  .conv-list::-webkit-scrollbar { width: 4px; }
  .conv-list::-webkit-scrollbar-track { background: transparent; }
  .conv-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
  .dark .conv-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
  .conv-sidebar { background: transparent !important; }
  .dark .conv-sidebar { background: transparent !important; }
`;

export function ConversationList({ onSelect }: { onSelect?: (id: string) => void }) {
  const [activeId, setActiveId] = useState<string>('1');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const today = FAKE_CONVERSATIONS.filter((c) => isToday(c.date));
  const yesterdayList = FAKE_CONVERSATIONS.filter((c) => isYesterday(c.date));
  const olderList = FAKE_CONVERSATIONS.filter((c) => !isToday(c.date) && !isYesterday(c.date));

  const handleClick = (id: string) => {
    setActiveId(id);
    onSelect?.(id);
  };

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderGroup = (label: string, items: Conversation[]) => {
    if (items.length === 0) return null;
    const isCollapsed = collapsed[label];
    return (
      <div style={{ marginBottom: '8px' }}>
        <button
          onClick={() => toggleGroup(label)}
          style={{
            fontSize: '11px', fontWeight: 600, color: 'hsl(var(--muted-foreground))',
            padding: '4px 12px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px',
            background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '4px', fontFamily: 'inherit', width: '100%', justifyContent: 'space-between',
          }}
        >
          {label}
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
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
            <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {conv.title}
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
        <div style={{ padding: '8px 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button
            style={{
              width: '28px', height: '28px', borderRadius: '8px', border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'hsl(var(--muted-foreground))', transition: 'background 0.15s',
            }}
            className="conv-item"
            title="New conversation"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="conv-list" style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
          {renderGroup('Today', today)}
          {renderGroup('Yesterday', yesterdayList)}
          {renderGroup('Older', olderList)}
        </div>
      </div>
    </>
  );
}
