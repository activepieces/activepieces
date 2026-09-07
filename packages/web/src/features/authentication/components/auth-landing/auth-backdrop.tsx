import {
  ArrowUp,
  BarChart3,
  Check,
  ChevronsUpDown,
  House,
  MessageCircle,
  Mic,
  Paperclip,
  Plus,
  Search,
  Sparkles,
  Table2,
  Workflow,
} from 'lucide-react';

import { flagsHooks } from '@/hooks/flags-hooks';

export function AuthBackdrop() {
  const branding = flagsHooks.useWebsiteBranding();
  const logoUrl = branding.logos.logoIconUrl;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex select-none overflow-hidden bg-sidebar animate-in fade-in duration-700"
    >
      <SidebarFacsimile logoUrl={logoUrl} />
      <div className="min-w-0 flex-1 p-1.5">
        <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-background shadow-[2px_0px_4px_-2px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 border-b px-5 py-3 text-sm text-muted-foreground">
            <MessageCircle className="size-4" />
            <span className="font-medium text-foreground/80">
              Daily Stripe summary
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden px-8 pt-8">
            <div className="mx-auto w-full max-w-3xl space-y-6">
              {CONVERSATION.map((turn, index) =>
                turn.role === 'user' ? (
                  <UserTurn key={index} text={turn.text} />
                ) : (
                  <AssistantTurn key={index} turn={turn} />
                ),
              )}
            </div>
          </div>
          <div className="px-8 pb-6 pt-4">
            <div className="mx-auto w-full max-w-3xl">
              <ComposerFacsimile />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarFacsimile({ logoUrl }: { logoUrl: string }) {
  return (
    <div className="hidden w-60 shrink-0 flex-col gap-4 px-3 py-3 lg:flex">
      <div className="flex items-center gap-2 rounded-md px-1.5 py-1">
        <img src={logoUrl} alt="" className="size-5 object-contain" />
        <span className="truncate text-sm font-medium text-foreground/80">
          Acme Inc
        </span>
        <ChevronsUpDown className="ml-auto size-3.5 text-muted-foreground" />
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-primary px-2.5 py-2 text-sm font-medium text-primary-foreground shadow-sm">
        <Plus className="size-4" strokeWidth={2.5} />
        New chat
      </div>

      <div className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
          <div
            key={label}
            className={
              active
                ? 'flex items-center gap-2.5 rounded-md bg-accent px-2.5 py-1.5 text-sm font-medium text-accent-foreground'
                : 'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground'
            }
          >
            <Icon className="size-4" />
            {label}
          </div>
        ))}
      </div>

      <div className="flex min-h-0 flex-col gap-1">
        <span className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
          Recent
        </span>
        {RECENT_CHATS.map((title, index) => (
          <div
            key={title}
            className={
              index === 0
                ? 'truncate rounded-md bg-accent px-2.5 py-1.5 text-[13px] text-accent-foreground'
                : 'truncate rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground'
            }
          >
            {title}
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-2 rounded-md px-1.5 py-1">
        <div className="size-6 rounded-full bg-muted" />
        <div className="h-2.5 w-20 rounded-full bg-muted" />
      </div>
    </div>
  );
}

function UserTurn({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-muted px-4 py-3 text-[15px] leading-relaxed text-foreground/80">
        {text}
      </div>
    </div>
  );
}

function AssistantTurn({ turn }: { turn: AssistantTurnData }) {
  return (
    <div className="space-y-3">
      {turn.activity && (
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1 text-xs text-foreground/70">
          <Sparkles className="size-3" />
          {turn.activity}
        </span>
      )}
      <p className="text-[15px] leading-relaxed text-foreground/75">
        {turn.text}
      </p>
      {turn.steps && (
        <div className="space-y-1.5 rounded-xl border bg-muted/30 p-3">
          {turn.steps.map((step) => (
            <div
              key={step}
              className="flex items-center gap-2 text-[13px] text-foreground/70"
            >
              <Check className="size-3.5 text-primary" strokeWidth={3} />
              {step}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ComposerFacsimile() {
  return (
    <div className="rounded-2xl border border-foreground/20 bg-background px-4 pb-2.5 pt-3.5">
      <p className="text-sm text-muted-foreground">
        Tell me what you need... (@ to mention, : for emoji)
      </p>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground">
            <Paperclip className="size-4" />
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground">
            <Mic className="size-4" />
          </div>
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <ArrowUp className="size-4" />
        </div>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { icon: House, label: 'Home', active: false },
  { icon: MessageCircle, label: 'Chats', active: true },
  { icon: Workflow, label: 'Automations', active: false },
  { icon: Table2, label: 'Tables', active: false },
  { icon: BarChart3, label: 'Insights', active: false },
  { icon: Search, label: 'Search', active: false },
];

const RECENT_CHATS = [
  'Daily Stripe summary',
  'Chase overdue invoices',
  'Onboard new signups',
  'Weekly report to leadership',
  'Sync HubSpot to Sheets',
  'Tidy up my inbox',
];

const CONVERSATION: Turn[] = [
  {
    role: 'user',
    text: "Every morning, pull yesterday's Stripe payments into a Google Sheet and post a summary in Slack.",
  },
  {
    role: 'assistant',
    activity: 'Checked Stripe, Google Sheets and Slack',
    text: 'Done. It runs at 8:00 every morning, writes one row per payment, and posts the daily total to #finance.',
    steps: [
      'Every day at 08:00',
      'Stripe: list yesterday’s payments',
      'Google Sheets: append rows',
      'Slack: send summary to #finance',
    ],
  },
  {
    role: 'user',
    text: 'Nice. Also ping me if a payment fails.',
  },
  {
    role: 'assistant',
    text: 'Added a branch: failed payments now send you a direct message the moment Stripe reports them.',
  },
];

type AssistantTurnData = {
  role: 'assistant';
  text: string;
  activity?: string;
  steps?: string[];
};

type Turn = AssistantTurnData | { role: 'user'; text: string };
