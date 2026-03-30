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
  .conv-item { display: flex; align-items: center; padding: 4px 8px; border-radius: 6px; cursor: pointer; transition: background 0.15s; border: none; background: transparent; width: 100%; text-align: left; font-family: inherit; color: hsl(var(--foreground)); }
  .conv-item:hover { background: rgba(0,0,0,0.05); }
  .dark .conv-item:hover { background: rgba(255,255,255,0.07); }
  .conv-item.active { background: rgba(0,0,0,0.08); }
  .dark .conv-item.active { background: rgba(255,255,255,0.1); }
  .conv-list { scrollbar-width: none; }
  .conv-list::-webkit-scrollbar { width: 0; }
  .conv-list:hover { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.15) transparent; }
  .conv-list:hover::-webkit-scrollbar { width: 4px; }
  .conv-list:hover::-webkit-scrollbar-track { background: transparent; }
  .conv-list:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
  .dark .conv-list:hover { scrollbar-color: rgba(255,255,255,0.2) transparent; }
  .dark .conv-list:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
  .conv-sidebar { background: transparent !important; opacity: 0.4; transition: opacity 0.2s; }
  .conv-sidebar:hover { opacity: 1; }
  .dark .conv-sidebar { background: transparent !important; }
  .group-label { color: hsl(var(--muted-foreground)); transition: color 0.15s, background 0.15s; border-radius: 6px; }
  .group-label:hover { color: hsl(var(--foreground)); background: rgba(0,0,0,0.08); }
  .dark .group-label:hover { color: #fff; background: rgba(255,255,255,0.12); }
`;

export function ConversationList({ onSelect }: { onSelect?: (id: string) => void }) {
  const [activeId, setActiveId] = useState<string>('1');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ Older: true });

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
        <div className="conv-list" style={{ flex: 1, overflowY: 'scroll', padding: '12px 8px 12px' }}>
          {renderGroup('Today', today)}
          {renderGroup('Yesterday', yesterdayList)}
          {renderGroup('Older', olderList)}
        </div>
      </div>
    </>
  );
}
