import {
  Clock,
  Code,
  Database,
  GitBranch,
  Inbox,
  Pencil,
  Play,
  Plus,
  Repeat,
  Send,
  Trash2,
  Webhook,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const KNOWN_PIECE_SLUGS = [
  'slack',
  'gmail',
  'google-sheets',
  'google-drive',
  'google-calendar',
  'google-docs',
  'notion',
  'airtable',
  'hubspot',
  'discord',
  'telegram',
  'whatsapp',
  'salesforce',
  'stripe',
  'shopify',
  'mailchimp',
  'asana',
  'trello',
  'jira',
  'github',
  'gitlab',
  'linear',
  'intercom',
  'zendesk',
  'twilio',
  'sendgrid',
  'openai',
  'anthropic',
];

const PIECE_KEYWORD_MAP: Record<string, string> = {
  'google sheets': 'google-sheets',
  'google sheet': 'google-sheets',
  sheets: 'google-sheets',
  'google drive': 'google-drive',
  'google calendar': 'google-calendar',
  'google docs': 'google-docs',
  'google doc': 'google-docs',
  email: 'gmail',
};

const PIECE_SLUG_PATTERNS = KNOWN_PIECE_SLUGS.map((slug) => ({
  slug,
  pattern: new RegExp(
    `\\b${slug.replace(/-/g, ' ').replace(/\s+/g, '\\s+')}\\b`,
  ),
}));

function inferKind({
  label,
  index,
}: {
  label: string;
  index: number;
}): ProposalStepKind {
  const text = label.toLowerCase();
  const isFirst = index === 0;

  if (isFirst) {
    if (/schedul|every\s+\d|cron|hour|minute|daily|weekly|monthly/.test(text)) {
      return 'trigger_schedule';
    }
    if (/webhook|http\s*(request|trigger)|incoming\s+request/.test(text)) {
      return 'trigger_webhook';
    }
    if (/form|on\s+submit|manual\s+trigger/.test(text)) {
      return 'trigger_form';
    }
    if (/trigger|when\s+/.test(text)) {
      return 'trigger_generic';
    }
  }

  if (/branch|router|condition|if\s+/.test(text)) return 'action_router';
  if (/loop|for\s+each|iterate/.test(text)) return 'action_loop';
  if (/code|javascript|script|run\s+code/.test(text)) return 'action_code';
  if (/send|notify|email|message|post\s+to/.test(text)) return 'action_send';
  if (/delete|remove/.test(text)) return 'action_delete';
  if (/create|insert|add\s+row|append|new\s+record/.test(text)) {
    return 'action_create';
  }
  if (/update|set\s+|change|edit/.test(text)) return 'action_update';
  if (/query|find|search|list|get\s+rows|fetch|look\s*up|read/.test(text)) {
    return 'action_query';
  }

  return isFirst ? 'trigger_generic' : 'action_generic';
}

function inferPieceName({ label }: { label: string }): string | undefined {
  const text = label.toLowerCase();

  for (const [keyword, slug] of Object.entries(PIECE_KEYWORD_MAP)) {
    if (text.includes(keyword)) return `@activepieces/piece-${slug}`;
  }

  for (const { slug, pattern } of PIECE_SLUG_PATTERNS) {
    if (pattern.test(text)) return `@activepieces/piece-${slug}`;
  }

  return undefined;
}

function iconFor({ kind }: { kind: ProposalStepKind }): LucideIcon {
  switch (kind) {
    case 'trigger_schedule':
      return Clock;
    case 'trigger_webhook':
      return Webhook;
    case 'trigger_form':
      return Inbox;
    case 'trigger_generic':
      return Play;
    case 'action_query':
      return Database;
    case 'action_update':
      return Pencil;
    case 'action_create':
      return Plus;
    case 'action_delete':
      return Trash2;
    case 'action_send':
      return Send;
    case 'action_code':
      return Code;
    case 'action_router':
      return GitBranch;
    case 'action_loop':
      return Repeat;
    case 'action_generic':
      return Zap;
  }
}

function toneFor({ kind }: { kind: ProposalStepKind }): string {
  if (kind.startsWith('trigger_')) return 'bg-primary/10 text-primary';
  switch (kind) {
    case 'action_query':
      return 'bg-sky-500/10 text-sky-600 dark:text-sky-400';
    case 'action_update':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case 'action_create':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'action_delete':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
    case 'action_send':
      return 'bg-violet-500/10 text-violet-600 dark:text-violet-400';
    case 'action_code':
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-300';
    case 'action_router':
      return 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400';
    case 'action_loop':
      return 'bg-teal-500/10 text-teal-600 dark:text-teal-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export const stepVisuals = {
  inferKind,
  inferPieceName,
  iconFor,
  toneFor,
};

export type ProposalStepKind =
  | 'trigger_schedule'
  | 'trigger_webhook'
  | 'trigger_form'
  | 'trigger_generic'
  | 'action_query'
  | 'action_update'
  | 'action_create'
  | 'action_delete'
  | 'action_send'
  | 'action_code'
  | 'action_router'
  | 'action_loop'
  | 'action_generic';

export type ProposalStep = {
  label: string;
  kind: ProposalStepKind;
  piece?: string;
};
