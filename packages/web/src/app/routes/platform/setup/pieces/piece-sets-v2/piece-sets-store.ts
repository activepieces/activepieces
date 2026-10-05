import { ColorName } from '@activepieces/shared';
import { create } from 'zustand';

const LOGO = (slug: string) =>
  `https://cdn.activepieces.com/pieces/${slug}.png`;

function kindOf(name: string): ActionKind {
  const verb = name.split(' ')[0];
  if (READ_VERBS.includes(verb)) return 'read';
  if (DELETE_VERBS.includes(verb)) return 'delete';
  return 'write';
}

function crud(objects: string[], verbs: string[]): string[] {
  return objects.flatMap((object) => verbs.map((verb) => `${verb} ${object}`));
}

function piece({
  name,
  category,
  slug,
  actions,
  triggers = [],
  custom = false,
}: {
  name: string;
  category: string;
  slug?: string;
  actions: string[];
  triggers?: string[];
  custom?: boolean;
}): CatalogPiece {
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name,
    category,
    logoUrl: slug ? LOGO(slug) : undefined,
    custom,
    actions: actions.map((a) => ({ name: a, kind: kindOf(a) })),
    triggers,
  };
}

function allowedActionNames(p: CatalogPiece, access: PieceAccess): string[] {
  if (!access.allowed) return [];
  if (access.actions === 'all') return p.actions.map((a) => a.name);
  return access.actions;
}

function allowedTriggerNames(p: CatalogPiece, access: PieceAccess): string[] {
  if (!access.allowed) return [];
  if (access.triggers === 'all') return p.triggers;
  return access.triggers;
}

function accessOf(set: PieceSet, pieceId: string): PieceAccess {
  return (
    set.overrides[pieceId] ?? {
      allowed: set.includeNewPieces,
      actions: 'all',
      triggers: 'all',
    }
  );
}

function liveFlows({
  set,
  pieceId,
}: {
  set: PieceSet;
  pieceId: string;
}): number {
  const usage = USAGE[pieceId] ?? {};
  return set.projectIds.reduce((sum, id) => sum + (usage[id] ?? 0), 0);
}

function setOfProject(sets: PieceSet[], projectId: string): PieceSet {
  return (
    sets.find((s) => s.projectIds.includes(projectId)) ??
    sets.find((s) => s.isDefault) ??
    sets[0]
  );
}

function updateSet(
  sets: PieceSet[],
  id: string,
  fn: (set: PieceSet) => PieceSet,
): PieceSet[] {
  return sets.map((s) =>
    s.id === id ? { ...fn(s), updatedAt: Date.now() } : s,
  );
}

function withoutUnavailableRequired(set: PieceSet): PieceSet {
  return {
    ...set,
    required: set.required.filter((r) => {
      const p = CATALOG.find((c) => c.id === r.pieceId);
      return p
        ? allowedActionNames(p, accessOf(set, p.id)).includes(r.action)
        : false;
    }),
  };
}

function keyFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function only(ids: string[]): Record<string, PieceAccess> {
  return Object.fromEntries(
    CATALOG.map((p) => [
      p.id,
      {
        allowed: ids.includes(p.id),
        actions: 'all',
        triggers: 'all',
      } satisfies PieceAccess,
    ]),
  );
}

function blocked(ids: string[]): Record<string, PieceAccess> {
  return Object.fromEntries(
    ids.map((id) => [
      id,
      { allowed: false, actions: 'all', triggers: 'all' } satisfies PieceAccess,
    ]),
  );
}

function readOnly(id: string): PieceAccess {
  const p = CATALOG.find((c) => c.id === id);
  return {
    allowed: true,
    actions: p
      ? p.actions.filter((a) => a.kind === 'read').map((a) => a.name)
      : [],
    triggers: 'all',
    newActions: 'block',
  };
}

const READ_VERBS = [
  'Get',
  'Find',
  'Search',
  'List',
  'Read',
  'Run',
  'Download',
  'Export',
  'Lookup',
];
const DELETE_VERBS = [
  'Delete',
  'Remove',
  'Archive',
  'Cancel',
  'Refund',
  'Ban',
  'Clear',
  'Void',
];

const HOUR = 3600 * 1000;
const NOW = Date.now();

export const CATALOG: CatalogPiece[] = [
  piece({
    name: 'Audit Log',
    category: 'Your pieces',
    custom: true,
    actions: ['Record event', 'Search events', 'Export events'],
  }),
  piece({
    name: 'Acme CRM',
    category: 'Your pieces',
    custom: true,
    actions: [
      'Create record',
      'Update record',
      'Find record',
      'Log activity',
      'Delete record',
    ],
    triggers: ['Record created', 'Record updated'],
  }),
  piece({
    name: 'Salesforce',
    category: 'Sales',
    slug: 'salesforce',
    actions: crud(
      [
        'account',
        'contact',
        'lead',
        'opportunity',
        'case',
        'task',
        'campaign',
        'quote',
        'contract',
        'order',
        'product',
        'price book',
        'event',
        'note',
        'attachment',
        'user',
        'report',
        'dashboard',
      ],
      ['Create', 'Update', 'Get', 'Find', 'Delete'],
    ).concat([
      'Run SOQL query',
      'Run SOSL search',
      'Bulk upsert records',
      'Convert lead',
      'Add contact to campaign',
      'Send email',
    ]),
    triggers: [
      'New record',
      'Updated record',
      'New lead',
      'New opportunity',
      'Opportunity stage changed',
      'New case',
      'New outbound message',
    ],
  }),
  piece({
    name: 'HubSpot',
    category: 'Sales',
    slug: 'hubspot',
    actions: crud(
      [
        'contact',
        'company',
        'deal',
        'ticket',
        'product',
        'line item',
        'note',
        'task',
        'meeting',
        'call',
        'email engagement',
      ],
      ['Create', 'Update', 'Get', 'Search', 'Delete'],
    ).concat([
      'Add contact to list',
      'Remove contact from list',
      'Associate records',
      'Enroll in workflow',
    ]),
    triggers: [
      'New contact',
      'Updated contact',
      'New deal',
      'Deal stage changed',
      'New ticket',
      'New form submission',
      'New company',
    ],
  }),
  piece({
    name: 'Pipedrive',
    category: 'Sales',
    slug: 'pipedrive',
    actions: crud(
      ['deal', 'person', 'organization', 'activity', 'note'],
      ['Create', 'Update', 'Find', 'Delete'],
    ),
    triggers: ['New deal', 'Updated deal', 'New person'],
  }),
  piece({
    name: 'Slack',
    category: 'Communication',
    slug: 'slack',
    actions: [
      'Send message',
      'Send direct message',
      'Reply in thread',
      'Update message',
      'Delete message',
      'Add reaction',
      'Upload file',
      'Find user by email',
      'Get channel history',
      'List channels',
      'Create channel',
      'Archive channel',
      'Invite user to channel',
      'Set channel topic',
      'Get user profile',
      'Request approval',
    ],
    triggers: [
      'New message',
      'New message in channel',
      'New reaction',
      'New mention',
      'New user',
      'Channel created',
    ],
  }),
  piece({
    name: 'Gmail',
    category: 'Communication',
    slug: 'gmail',
    actions: [
      'Send email',
      'Reply to email',
      'Create draft',
      'Find email',
      'Get email',
      'Search emails',
      'Add label',
      'Remove label',
      'Archive email',
      'Delete email',
      'Get attachment',
    ],
    triggers: [
      'New email',
      'New labeled email',
      'New attachment',
      'New starred email',
    ],
  }),
  piece({
    name: 'Microsoft Outlook',
    category: 'Communication',
    slug: 'microsoft-outlook',
    actions: [
      'Send email',
      'Reply to email',
      'Create draft',
      'Find email',
      'Get email',
      'Move email',
      'Delete email',
      'Create calendar event',
    ],
    triggers: ['New email', 'New calendar event'],
  }),
  piece({
    name: 'Microsoft Teams',
    category: 'Communication',
    slug: 'microsoft-teams',
    actions: [
      'Send channel message',
      'Send chat message',
      'Reply to message',
      'Create channel',
      'Get chat messages',
      'List teams',
      'Add member',
      'Remove member',
      'Request approval',
    ],
    triggers: ['New channel message', 'New chat message'],
  }),
  piece({
    name: 'Discord',
    category: 'Communication',
    slug: 'discord',
    actions: [
      'Send message',
      'Send embed',
      'Find member',
      'Add role',
      'Remove role',
      'Ban member',
      'Delete message',
    ],
    triggers: ['New message', 'New member'],
  }),
  piece({
    name: 'Twilio',
    category: 'Communication',
    slug: 'twilio',
    actions: [
      'Send SMS',
      'Send WhatsApp message',
      'Make call',
      'Get message',
      'List messages',
    ],
    triggers: ['New incoming SMS'],
  }),
  piece({
    name: 'Telegram',
    category: 'Communication',
    slug: 'telegram-bot',
    actions: ['Send message', 'Send photo', 'Get chat', 'Delete message'],
    triggers: ['New message'],
  }),
  piece({
    name: 'OpenAI',
    category: 'AI',
    slug: 'openai',
    actions: [
      'Ask ChatGPT',
      'Ask assistant',
      'Generate image',
      'Text to speech',
      'Transcribe audio',
      'Translate audio',
      'Extract structured data',
      'Classify text',
      'Vision prompt',
      'Create embedding',
    ],
  }),
  piece({
    name: 'Claude',
    category: 'AI',
    slug: 'claude',
    actions: [
      'Ask Claude',
      'Extract structured data',
      'Summarize document',
      'Classify text',
    ],
  }),
  piece({
    name: 'Google Gemini',
    category: 'AI',
    slug: 'google-gemini',
    actions: [
      'Generate content',
      'Chat',
      'Generate from image',
      'Count tokens',
    ],
  }),
  piece({
    name: 'Perplexity',
    category: 'AI',
    slug: 'perplexity-ai',
    actions: ['Ask Perplexity'],
  }),
  piece({
    name: 'Mistral',
    category: 'AI',
    slug: 'mistral-ai',
    actions: ['Ask Mistral', 'Create embedding'],
  }),
  piece({
    name: 'Google Sheets',
    category: 'Productivity',
    slug: 'google-sheets',
    actions: [
      'Insert row',
      'Insert multiple rows',
      'Update row',
      'Update multiple rows',
      'Find rows',
      'Get rows',
      'Get next rows',
      'Delete row',
      'Clear sheet',
      'Create spreadsheet',
      'Create worksheet',
      'Copy worksheet',
      'Find spreadsheets',
      'Export sheet',
    ],
    triggers: ['New row', 'Updated row', 'New spreadsheet', 'New worksheet'],
  }),
  piece({
    name: 'Google Drive',
    category: 'Productivity',
    slug: 'google-drive',
    actions: [
      'Upload file',
      'Create folder',
      'Create file from text',
      'Copy file',
      'Move file',
      'Share file',
      'Search files',
      'Get file',
      'Download file',
      'List files',
      'Delete file',
      'Add file permission',
      'Remove file permission',
    ],
    triggers: ['New file', 'New folder'],
  }),
  piece({
    name: 'Google Calendar',
    category: 'Productivity',
    slug: 'google-calendar',
    actions: [
      'Create event',
      'Update event',
      'Find events',
      'Get event',
      'Add attendees',
      'Delete event',
      'Find free busy',
    ],
    triggers: ['New event', 'Event updated', 'Event starts soon'],
  }),
  piece({
    name: 'Notion',
    category: 'Productivity',
    slug: 'notion',
    actions: [
      'Create page',
      'Create database item',
      'Update database item',
      'Find database item',
      'Get page',
      'Append to page',
      'Search',
      'Archive page',
      'Restore page',
      'Add comment',
    ],
    triggers: ['New database item', 'Updated database item', 'New comment'],
  }),
  piece({
    name: 'Airtable',
    category: 'Productivity',
    slug: 'airtable',
    actions: [
      'Create record',
      'Update record',
      'Find record',
      'Get record',
      'Upload file to column',
      'Delete record',
      'Create base',
      'Create table',
    ],
    triggers: ['New record', 'Updated record'],
  }),
  piece({
    name: 'Asana',
    category: 'Productivity',
    slug: 'asana',
    actions: [
      'Create task',
      'Update task',
      'Find task',
      'Add comment',
      'Create project',
      'Delete task',
    ],
    triggers: ['New task', 'Task completed'],
  }),
  piece({
    name: 'Trello',
    category: 'Productivity',
    slug: 'trello',
    actions: [
      'Create card',
      'Update card',
      'Get card',
      'Move card',
      'Delete card',
      'Add comment',
    ],
    triggers: ['New card', 'Card moved'],
  }),
  piece({
    name: 'Monday.com',
    category: 'Productivity',
    slug: 'monday',
    actions: [
      'Create item',
      'Update item',
      'Get item',
      'Create update',
      'Delete item',
    ],
    triggers: ['New item', 'Column value changed'],
  }),
  piece({
    name: 'Stripe',
    category: 'Finance',
    slug: 'stripe',
    actions: crud(
      [
        'customer',
        'invoice',
        'payment intent',
        'subscription',
        'product',
        'price',
        'coupon',
      ],
      ['Create', 'Update', 'Get', 'Search'],
    ).concat([
      'Create refund',
      'Cancel subscription',
      'Void invoice',
      'Delete customer',
      'Create payment link',
      'Create checkout session',
    ]),
    triggers: [
      'New payment',
      'New customer',
      'New invoice',
      'Payment failed',
      'New subscription',
      'Subscription cancelled',
      'New refund',
    ],
  }),
  piece({
    name: 'QuickBooks',
    category: 'Finance',
    slug: 'quickbooks',
    actions: [
      'Create invoice',
      'Find invoice',
      'Create customer',
      'Find customer',
      'Create bill',
      'Create payment',
      'Void invoice',
    ],
    triggers: ['New invoice', 'New customer'],
  }),
  piece({
    name: 'Xero',
    category: 'Finance',
    slug: 'xero',
    actions: [
      'Create invoice',
      'Get contacts',
      'Create contact',
      'Create bank transaction',
    ],
    triggers: ['New invoice'],
  }),
  piece({
    name: 'Zendesk',
    category: 'Support',
    slug: 'zendesk',
    actions: [
      'Create ticket',
      'Update ticket',
      'Search tickets',
      'Get ticket',
      'Add comment',
      'Create user',
      'Find user',
      'Delete ticket',
    ],
    triggers: ['New ticket', 'Updated ticket', 'New user'],
  }),
  piece({
    name: 'Intercom',
    category: 'Support',
    slug: 'intercom',
    actions: [
      'Send message',
      'Create contact',
      'Find contact',
      'Add tag',
      'Create note',
      'Reply to conversation',
    ],
    triggers: ['New conversation', 'New contact'],
  }),
  piece({
    name: 'Freshdesk',
    category: 'Support',
    slug: 'freshdesk',
    actions: ['Create ticket', 'Get ticket', 'Update ticket'],
    triggers: ['New ticket'],
  }),
  piece({
    name: 'GitHub',
    category: 'Developer',
    slug: 'github',
    actions: [
      'Create issue',
      'Update issue',
      'Get issue',
      'Search issues',
      'Create comment',
      'Create pull request',
      'Merge pull request',
      'Create branch',
      'Delete branch',
      'Get file',
      'Create release',
      'Add labels',
    ],
    triggers: [
      'New issue',
      'New pull request',
      'New push',
      'New release',
      'New star',
    ],
  }),
  piece({
    name: 'Jira',
    category: 'Developer',
    slug: 'jira-cloud',
    actions: [
      'Create issue',
      'Update issue',
      'Search issues',
      'Get issue',
      'Transition issue',
      'Add comment',
      'Assign issue',
      'Delete issue',
    ],
    triggers: ['New issue', 'Updated issue'],
  }),
  piece({
    name: 'Linear',
    category: 'Developer',
    slug: 'linear',
    actions: ['Create issue', 'Update issue', 'Find issue', 'Create comment'],
    triggers: ['New issue', 'Updated issue'],
  }),
  piece({
    name: 'Postgres',
    category: 'Developer',
    slug: 'postgres',
    actions: [
      'Run query',
      'Find rows',
      'Insert row',
      'Insert multiple rows',
      'Update row',
      'Delete rows',
    ],
    triggers: ['New row'],
  }),
  piece({
    name: 'MySQL',
    category: 'Developer',
    slug: 'mysql',
    actions: [
      'Run query',
      'Find rows',
      'Insert row',
      'Update row',
      'Delete rows',
    ],
    triggers: ['New row'],
  }),
  piece({
    name: 'HTTP',
    category: 'Developer',
    slug: 'http',
    actions: ['Send request'],
  }),
  piece({
    name: 'Shopify',
    category: 'Commerce',
    slug: 'shopify',
    actions: crud(
      ['product', 'order', 'customer', 'collection'],
      ['Create', 'Update', 'Get', 'Find'],
    ).concat([
      'Cancel order',
      'Create fulfillment',
      'Adjust inventory',
      'Delete product',
    ]),
    triggers: ['New order', 'New customer', 'Order paid', 'Abandoned checkout'],
  }),
  piece({
    name: 'WooCommerce',
    category: 'Commerce',
    slug: 'woocommerce',
    actions: [
      'Create product',
      'Find product',
      'Create coupon',
      'Find customer',
    ],
    triggers: ['New order', 'New customer'],
  }),
  piece({
    name: 'Mailchimp',
    category: 'Marketing',
    slug: 'mailchimp',
    actions: [
      'Add member to list',
      'Update member',
      'Add note',
      'Find member',
      'Remove member from list',
      'Send campaign',
    ],
    triggers: ['New subscriber', 'Unsubscribe'],
  }),
  piece({
    name: 'LinkedIn',
    category: 'Marketing',
    slug: 'linkedin',
    actions: ['Create share', 'Create company update'],
  }),
  piece({
    name: 'Typeform',
    category: 'Marketing',
    slug: 'typeform',
    actions: ['Get responses'],
    triggers: ['New submission'],
  }),
];

export const CATEGORIES = [...new Set(CATALOG.map((p) => p.category))];

export const PROJECTS: DemoProject[] = [
  { id: 'fo', name: 'Finance Ops', color: ColorName.GREEN },
  { id: 'ac', name: 'Accounting', color: ColorName.BLUE },
  { id: 'pr', name: 'Payroll', color: ColorName.ORANGE },
  { id: 'lg', name: 'Legal', color: ColorName.LAVENDER },
  { id: 'cp', name: 'Compliance', color: ColorName.VIOLET },
  { id: 'mk', name: 'Marketing', color: ColorName.RED },
  { id: 'sa', name: 'Sales', color: ColorName.PURPLE },
  { id: 'su', name: 'Customer Support', color: ColorName.CYAN },
  { id: 'en', name: 'Engineering', color: ColorName.DARK_GREEN },
  { id: 'hr', name: 'People', color: ColorName.PINK },
  { id: 'op', name: 'Operations', color: ColorName.YELLOW },
  { id: 'it', name: 'IT', color: ColorName.BLUE },
  { id: 'gr', name: 'Growth', color: ColorName.DEEP_ORANGE },
  { id: 'rd', name: 'Research', color: ColorName.CYAN },
];

const USAGE: Record<string, Record<string, number>> = {
  slack: { fo: 6, ac: 3, mk: 14, su: 9, en: 11, op: 4, it: 5 },
  gmail: { fo: 4, ac: 7, mk: 8, sa: 12, lg: 2 },
  'google-sheets': { fo: 12, ac: 9, pr: 4, mk: 6, op: 7, gr: 3 },
  'google-drive': { lg: 5, cp: 3, hr: 2 },
  stripe: { fo: 5, ac: 2 },
  quickbooks: { ac: 4, fo: 2 },
  postgres: { fo: 3, en: 7, rd: 2 },
  'audit-log': { fo: 10, ac: 6, pr: 3, cp: 4 },
  'microsoft-teams': { pr: 2, hr: 3, lg: 1 },
  openai: { mk: 9, su: 6, en: 4, gr: 5, rd: 6 },
  claude: { su: 2, lg: 3, rd: 4 },
  hubspot: { sa: 15, mk: 5, gr: 4 },
  salesforce: { sa: 22 },
  zendesk: { su: 11 },
  github: { en: 8 },
  jira: { en: 6, su: 3, it: 4 },
  http: { en: 10, mk: 3, it: 2 },
  notion: { en: 3, hr: 4 },
  shopify: { gr: 6 },
  mailchimp: { mk: 7, gr: 2 },
};

const INITIAL_SETS: PieceSet[] = [
  {
    id: 'default',
    name: 'Default',
    key: 'default',
    isDefault: true,
    includeNewPieces: true,
    projectIds: ['mk', 'sa', 'su', 'en', 'hr', 'op', 'it', 'gr', 'rd'],
    sdkProjectCount: 0,
    requiredMode: 'any',
    required: [],
    overrides: blocked(['audit-log', 'acme-crm', 'discord', 'telegram']),
    updatedAt: NOW - 26 * HOUR,
  },
  {
    id: 'finance',
    name: 'Finance',
    key: 'finance',
    isDefault: false,
    includeNewPieces: false,
    projectIds: ['fo', 'ac', 'pr'],
    sdkProjectCount: 0,
    requiredMode: 'all',
    required: [{ pieceId: 'audit-log', action: 'Record event' }],
    overrides: {
      ...only([
        'audit-log',
        'slack',
        'gmail',
        'google-sheets',
        'microsoft-teams',
        'stripe',
        'quickbooks',
        'xero',
        'postgres',
        'google-drive',
      ]),
      slack: {
        allowed: true,
        actions: [
          'Send message',
          'Send direct message',
          'Reply in thread',
          'Find user by email',
          'Get channel history',
          'Request approval',
        ],
        triggers: ['New message', 'New mention'],
        newActions: 'block',
      },
      gmail: readOnly('gmail'),
      stripe: readOnly('stripe'),
      postgres: readOnly('postgres'),
    },
    updatedAt: NOW - 2 * HOUR,
  },
  {
    id: 'legal',
    name: 'Legal and compliance',
    key: 'legal',
    isDefault: false,
    includeNewPieces: false,
    projectIds: ['lg', 'cp'],
    sdkProjectCount: 0,
    requiredMode: 'any',
    required: [],
    overrides: {
      ...only([
        'google-drive',
        'gmail',
        'microsoft-teams',
        'claude',
        'audit-log',
        'notion',
        'microsoft-outlook',
      ]),
      'google-drive': readOnly('google-drive'),
      gmail: readOnly('gmail'),
    },
    updatedAt: NOW - 5 * 24 * HOUR,
  },
  {
    id: 'starter',
    name: 'Starter plan',
    key: 'starter',
    isDefault: false,
    includeNewPieces: false,
    projectIds: [],
    sdkProjectCount: 1284,
    requiredMode: 'any',
    required: [
      { pieceId: 'acme-crm', action: 'Create record' },
      { pieceId: 'acme-crm', action: 'Log activity' },
    ],
    overrides: only([
      'acme-crm',
      'slack',
      'gmail',
      'google-sheets',
      'notion',
      'airtable',
      'trello',
      'typeform',
    ]),
    updatedAt: NOW - 9 * 24 * HOUR,
  },
  {
    id: 'pro',
    name: 'Pro plan',
    key: 'pro',
    isDefault: false,
    includeNewPieces: true,
    projectIds: [],
    sdkProjectCount: 377,
    requiredMode: 'any',
    required: [
      { pieceId: 'acme-crm', action: 'Create record' },
      { pieceId: 'acme-crm', action: 'Log activity' },
    ],
    overrides: {
      ...blocked(['audit-log', 'postgres', 'mysql', 'http', 'discord']),
      salesforce: readOnly('salesforce'),
    },
    updatedAt: NOW - 3 * 24 * HOUR,
  },
];

export const pieceSetsUtils = {
  accessOf,
  catalogSize: () => CATALOG.length,
  allowedActionNames,
  allowedTriggerNames,
  liveFlows,
  setOfProject,
  piece(id: string): CatalogPiece | undefined {
    return CATALOG.find((p) => p.id === id);
  },
  project(id: string): DemoProject | undefined {
    return PROJECTS.find((p) => p.id === id);
  },
  isLimited(p: CatalogPiece, access: PieceAccess): boolean {
    return (
      access.allowed &&
      (allowedActionNames(p, access).length < p.actions.length ||
        allowedTriggerNames(p, access).length < p.triggers.length)
    );
  },
  allowedCount(set: PieceSet): number {
    return CATALOG.filter((p) => accessOf(set, p.id).allowed).length;
  },
  limitedCount(set: PieceSet): number {
    return CATALOG.filter((p) =>
      pieceSetsUtils.isLimited(p, accessOf(set, p.id)),
    ).length;
  },
};

export const usePieceSetsStore = create<PieceSetsState>((set) => {
  const change = (fn: (sets: PieceSet[]) => PieceSet[]) =>
    set((s) => ({ sets: fn(s.sets) }));

  return {
    sets: INITIAL_SETS,

    setAllowed: ({ setId, pieceIds, allowed }) =>
      change((sets) =>
        updateSet(sets, setId, (s) =>
          withoutUnavailableRequired({
            ...s,
            overrides: {
              ...s.overrides,
              ...Object.fromEntries(
                pieceIds.map((id) => [id, { ...accessOf(s, id), allowed }]),
              ),
            },
          }),
        ),
      ),

    setPieceAccess: ({ setId, pieceId, access, required }) =>
      change((sets) =>
        updateSet(sets, setId, (s) =>
          withoutUnavailableRequired({
            ...s,
            overrides: { ...s.overrides, [pieceId]: access },
            required: [
              ...s.required.filter((r) => r.pieceId !== pieceId),
              ...required.map((action) => ({ pieceId, action })),
            ],
          }),
        ),
      ),

    setIncludeNewPieces: ({ setId, include }) =>
      change((sets) =>
        updateSet(sets, setId, (s) => {
          const pinned = Object.fromEntries(
            CATALOG.filter((p) => !s.overrides[p.id]).map((p) => [
              p.id,
              accessOf(s, p.id),
            ]),
          );
          return {
            ...s,
            includeNewPieces: include,
            overrides: { ...pinned, ...s.overrides },
          };
        }),
      ),

    setRequired: ({ setId, required, mode }) =>
      change((sets) =>
        updateSet(sets, setId, (s) =>
          withoutUnavailableRequired({ ...s, required, requiredMode: mode }),
        ),
      ),

    assignProjects: ({ setId, projectIds }) =>
      change((sets) => {
        const target = sets.find((s) => s.id === setId);
        const removed = (target?.projectIds ?? []).filter(
          (id) => !projectIds.includes(id),
        );
        return sets.map((s) => {
          if (s.id === setId)
            return { ...s, projectIds, updatedAt: Date.now() };
          const kept = s.projectIds.filter((id) => !projectIds.includes(id));
          return s.isDefault
            ? { ...s, projectIds: [...kept, ...removed] }
            : { ...s, projectIds: kept };
        });
      }),

    rename: ({ setId, name, key }) =>
      change((sets) => updateSet(sets, setId, (s) => ({ ...s, name, key }))),

    create: ({ name, key, copyFrom }) => {
      const id = `set-${Date.now().toString(36)}`;
      change((sets) => {
        const source = sets.find((s) => s.id === copyFrom);
        const everything = copyFrom === 'all';
        return [
          ...sets,
          {
            id,
            name,
            key: key || keyFromName(name) || id,
            isDefault: false,
            includeNewPieces: source?.includeNewPieces ?? everything,
            projectIds: [],
            sdkProjectCount: 0,
            requiredMode: source?.requiredMode ?? 'any',
            required: source ? [...source.required] : [],
            overrides: source
              ? { ...source.overrides }
              : everything
              ? {}
              : only([]),
            updatedAt: Date.now(),
          },
        ];
      });
      return id;
    },

    remove: ({ setId }) =>
      change((sets) => {
        const removed = sets.find((s) => s.id === setId);
        return sets
          .filter((s) => s.id !== setId)
          .map((s) =>
            s.isDefault && removed
              ? { ...s, projectIds: [...s.projectIds, ...removed.projectIds] }
              : s,
          );
      }),
  };
});

export type ActionKind = 'read' | 'write' | 'delete';
export type CatalogAction = { name: string; kind: ActionKind };
export type CatalogPiece = {
  id: string;
  name: string;
  category: string;
  logoUrl?: string;
  custom: boolean;
  actions: CatalogAction[];
  triggers: string[];
};
export type DemoProject = { id: string; name: string; color: ColorName };
export type PieceAccess = {
  allowed: boolean;
  actions: 'all' | string[];
  triggers: 'all' | string[];
  newActions?: 'allow' | 'block';
};
export type RequiredAction = { pieceId: string; action: string };
export type PieceSet = {
  id: string;
  name: string;
  key: string;
  isDefault: boolean;
  includeNewPieces: boolean;
  projectIds: string[];
  sdkProjectCount: number;
  requiredMode: 'any' | 'all';
  required: RequiredAction[];
  overrides: Record<string, PieceAccess>;
  updatedAt: number;
};

type PieceSetsState = {
  sets: PieceSet[];
  setAllowed: (params: {
    setId: string;
    pieceIds: string[];
    allowed: boolean;
  }) => void;
  setPieceAccess: (params: {
    setId: string;
    pieceId: string;
    access: PieceAccess;
    required: string[];
  }) => void;
  setIncludeNewPieces: (params: { setId: string; include: boolean }) => void;
  setRequired: (params: {
    setId: string;
    required: RequiredAction[];
    mode: 'any' | 'all';
  }) => void;
  assignProjects: (params: { setId: string; projectIds: string[] }) => void;
  rename: (params: { setId: string; name: string; key: string }) => void;
  create: (params: {
    name: string;
    key: string;
    copyFrom: string | null;
  }) => string;
  remove: (params: { setId: string }) => void;
};
