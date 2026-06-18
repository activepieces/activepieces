import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

import { executePreset } from '../common/jmap';
import {
  accountIdProp,
  optionalApiKeyProp,
  projectStoreHintProp,
} from '../common/props';
import {
  assertStoredCredentials,
  createSession,
  normalizeAccountId,
} from '../common/session';

interface InboxEmailRow {
  id?: string;
  receivedAt?: string;
  subject?: string;
  from?: unknown;
  preview?: string;
}

function extractEmails(body: unknown): InboxEmailRow[] {
  if (!body || typeof body !== 'object') return [];
  const methodResponses = (body as { methodResponses?: unknown[] })
    .methodResponses;
  if (!Array.isArray(methodResponses)) return [];

  for (const entry of methodResponses) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const payload = entry[1];
    if (
      payload &&
      typeof payload === 'object' &&
      Array.isArray((payload as { list?: unknown }).list)
    ) {
      return (payload as { list: InboxEmailRow[] }).list;
    }
  }
  return [];
}

function receivedMs(value: string | undefined): number {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

export const newEmailTrigger = createTrigger({
  requireAuth: false,
  name: 'new_email_in_inbox',
  displayName: 'New Email in Inbox',
  description:
    'Polls your inbox on a schedule and fires when new mail arrives (~5 min).',
  aiMetadata: {
    description:
      'Fires when a new inbox message is detected on polling (~5 min). Each event is one email with id, subject, from, preview, receivedAt.',
  },
  props: {
    store_hint: projectStoreHintProp,
    account_id: accountIdProp,
    api_key: optionalApiKeyProp,
  },
  sampleData: {
    id: 'email-id-example',
    subject: 'Welcome to Atomic Mail',
    from: [{ email: 'hello@atomicmail.ai' }],
    preview: 'Your inbox is ready.',
    receivedAt: '2026-06-18T12:00:00.000Z',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put('lastPollMs', Date.now());
  },
  async onDisable() {
    return;
  },
  async run(context) {
    let lastPollMs = await context.store.get<number>('lastPollMs');
    if (lastPollMs == null) {
      lastPollMs = Date.now();
      await context.store.put('lastPollMs', lastPollMs);
    }
    const accountId = normalizeAccountId(context.propsValue.account_id);
    const inlineKey = context.propsValue.api_key?.trim();
    await assertStoredCredentials(context, accountId, inlineKey || undefined);
    const session = await createSession(context, accountId);
    const result = await executePreset(session, 'list_inbox.json');
    const emails = extractEmails(result.body);

    const newLast = emails.reduce(
      (acc, row) => Math.max(acc, receivedMs(row.receivedAt)),
      lastPollMs,
    );
    await context.store.put('lastPollMs', newLast);

    return emails
      .filter((row) => receivedMs(row.receivedAt) > lastPollMs)
      .map((row) => ({
        id: row.id,
        subject: row.subject,
        from: row.from,
        preview: row.preview,
        receivedAt: row.receivedAt,
      }));
  },
  async test(context) {
    const accountId = normalizeAccountId(context.propsValue.account_id);
    const inlineKey = context.propsValue.api_key?.trim();
    await assertStoredCredentials(context, accountId, inlineKey || undefined);
    const session = await createSession(context, accountId);
    const result = await executePreset(session, 'list_inbox.json');
    const emails = extractEmails(result.body);
    return emails.slice(0, 5);
  },
});
