import {
  AgentConversation,
  AgentConversationStatus,
  AgentRunSource,
  PersistedAgentMessage,
  PersistedAgentPartType,
  PersistedAgentRole,
} from '@activepieces/shared';

import type { DemoConversation } from './demo-backend';

const PREFIX = 'demo-hist-';
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const TITLES: Array<{
  title: string | null;
  ageMs: number;
  status?: AgentConversationStatus;
}> = [
  {
    title: 'Sync new Typeform leads to HubSpot',
    ageMs: 5 * 60_000,
    status: AgentConversationStatus.STREAMING,
  },
  {
    title: 'Why did the invoice flow fail last night?',
    ageMs: 40 * 60_000,
    status: AgentConversationStatus.ERROR,
  },
  { title: null, ageMs: 2 * HOUR },
  { title: 'Weekly **Slack** digest of open Jira tickets', ageMs: 3 * HOUR },
  {
    title:
      'Build an automation that watches the shared Google Drive folder for new signed contracts, extracts the customer name, contract value and renewal date, adds a row to the Revenue tracker sheet and pings #sales-wins with a summary',
    ageMs: 5 * HOUR,
  },
  { title: 'Summarize this week in support', ageMs: 26 * HOUR },
  { title: null, ageMs: 28 * HOUR },
  { title: 'Clean up duplicate contacts', ageMs: 30 * HOUR },
  {
    title: 'Draft the onboarding email sequence (5 emails, friendly tone)',
    ageMs: 3 * DAY,
  },
  { title: 'Which flows used the most tasks in October?', ageMs: 4 * DAY },
  {
    title: 'Translate product descriptions to French, German and Spanish',
    ageMs: 5 * DAY,
  },
  { title: 'Hi', ageMs: 6 * DAY },
  { title: 'Connect Stripe → QuickBooks', ageMs: 6.5 * DAY },
  {
    title:
      'Supercalifragilisticexpialidocious_flow_name_without_any_spaces_to_break_it',
    ageMs: 9 * DAY,
  },
  { title: 'Monthly churn report', ageMs: 14 * DAY },
  { title: null, ageMs: 20 * DAY },
  { title: 'Archive old Airtable records', ageMs: 45 * DAY },
  { title: 'Holiday auto-reply for the support inbox', ageMs: 300 * DAY },
  { title: 'Migrate Zapier zaps', ageMs: 420 * DAY },
];

const FILLER = [
  'Route new support tickets by language',
  'Post GitHub releases to Slack',
  'Daily standup reminder',
  'Score inbound leads with AI',
  'Backup Notion pages to Drive',
  'Track competitor pricing pages',
  'Notify sales when a trial converts',
  'Create Trello cards from emails',
];

let removed = new Set<string>();
let cached: AgentConversation[] | null = null;

function build(): AgentConversation[] {
  const now = Date.now();
  const rows = [
    ...TITLES,
    ...Array.from({ length: 40 }, (_, i) => ({
      title: `${FILLER[i % FILLER.length]} #${i + 1}`,
      ageMs: (8 + i * 3) * DAY,
      status: undefined,
    })),
  ];
  return rows.map((row, index) => {
    const stamp = new Date(now - row.ageMs).toISOString();
    return {
      id: `${PREFIX}${index}`,
      created: stamp,
      updated: stamp,
      platformId: 'demo',
      projectId: null,
      userId: 'demo',
      agentId: null,
      flowRunId: null,
      waitpointId: null,
      aiCredits: null,
      source: AgentRunSource.CHAT,
      title: row.title ?? null,
      modelName: null,
      modelTierId: null,
      providerConfigId: null,
      status: row.status ?? AgentConversationStatus.IDLE,
      activeRunId: null,
      messages: [],
      uiMessages: null,
      summary: null,
      summarizedUpToIndex: null,
    };
  });
}

function list(): AgentConversation[] {
  cached ??= build();
  return cached.filter((conv) => !removed.has(conv.id));
}

function transcript(title: string | null): PersistedAgentMessage[] {
  return [
    {
      role: PersistedAgentRole.USER,
      parts: [{ type: PersistedAgentPartType.TEXT, text: title ?? 'Hello' }],
    },
    {
      role: PersistedAgentRole.ASSISTANT,
      parts: [
        {
          type: PersistedAgentPartType.TEXT,
          text: 'This is a **sample chat** from the demo history. It is kept in memory and never saved.\n\nSend a message to keep going — the demo will reply.',
        },
      ],
    },
  ];
}

function materialize(id: string): DemoConversation | null {
  if (!id.startsWith(PREFIX)) return null;
  const conv = list().find((c) => c.id === id);
  if (!conv) return null;
  return {
    conv: { ...conv, status: AgentConversationStatus.IDLE },
    scenarioId: null,
    messages: transcript(conv.title ?? null),
    turns: 1,
    attempts: {},
    run: null,
  };
}

export const demoHistory = {
  list,
  materialize,
  isFake: (id: string) => id.startsWith(PREFIX),
  remove: (id: string) => {
    removed = new Set(removed).add(id);
  },
};
