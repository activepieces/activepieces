import { HttpMethod } from '@activepieces/pieces-common';
import { randomUUID } from 'node:crypto';
import { AppConnectionType, createTrigger, Property, Store, TriggerStrategy } from '@activepieces/pieces-framework';
import { fathomAuth, FathomAuthValue } from '../common/auth';
import { FathomApiError, fathomClient } from '../common/client';
import { fathomWebhook } from '../common/webhook';
import { fathomOutputSchemas } from '../output-schemas';

export const newRecording = createTrigger({
  auth: fathomAuth,
  name: 'newRecording',
  classification: 'READ',
  displayName: 'New Recording',
  description: 'Fires when Fathom finishes processing a new meeting recording. Turn on at least one of the Include options.',
  aiMetadata: {
    description:
      'Fires when Fathom finishes processing a new meeting recording, delivering its metadata plus whichever of transcript, summary, action items and CRM matches are enabled (at least one must be). Scope is configurable: your own recordings, recordings shared with you externally, recordings you shared with teams, and team recordings you can access. Deliveries are signature-checked and retries de-duplicated.',
  },
  props: {
    triggered_for: Property.MultiSelectDropdown({
      auth: fathomAuth,
      displayName: 'Trigger For',
      description: 'Select which types of recordings should trigger this webhook',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'My Recordings', value: 'my_recordings' },
            { label: 'Shared External Recordings', value: 'shared_external_recordings' },
            { label: 'My Shared With Team Recordings', value: 'my_shared_with_team_recordings' },
            { label: 'Shared Team Recordings', value: 'shared_team_recordings' },
          ],
        };
      },
      defaultValue: ['my_recordings'],
    }),
    include_transcript: Property.Checkbox({
      displayName: 'Include Transcript',
      description: 'Include the transcript in the webhook payload',
      required: false,
      defaultValue: false,
    }),
    include_summary: Property.Checkbox({
      displayName: 'Include Summary',
      description: 'Include the summary in the webhook payload. Fathom needs at least one Include option turned on.',
      required: false,
      defaultValue: true,
    }),
    include_action_items: Property.Checkbox({
      displayName: 'Include Action Items',
      description: 'Include the action items in the webhook payload',
      required: false,
      defaultValue: false,
    }),
    include_crm_matches: Property.Checkbox({
      displayName: 'Include CRM Matches',
      description: 'Include CRM matches in the webhook payload',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: {
    title: 'Quarterly Business Review',
    meeting_title: 'QBR 2025 Q1',
    meeting_type: 'Quarterly Business Review',
    recording_id: 123456789,
    url: 'https://fathom.video/xyz123',
    meeting_url: 'https://us02web.zoom.us/j/123456789',
    share_url: 'https://fathom.video/share/xyz123',
    created_at: '2025-03-01T17:01:30Z',
    scheduled_start_time: '2025-03-01T16:00:00Z',
    scheduled_end_time: '2025-03-01T17:00:00Z',
    recording_start_time: '2025-03-01T16:01:12Z',
    recording_end_time: '2025-03-01T17:00:55Z',
    calendar_invitees_domains_type: 'one_or_more_external',
    shared_with: 'single_team',
    transcript_language: 'en',
    transcript: [
      {
        speaker: { display_name: 'Jane Doe', matched_calendar_invitee_email: 'jane.doe@example.com' },
        text: "Let's revisit the budget allocations.",
        timestamp: '00:05:32',
      },
    ],
    default_summary: {
      template_name: 'general',
      markdown_formatted: '## Summary\nWe reviewed Q1 OKRs, identified budget risks, and agreed to revisit projections next month.\n',
    },
    action_items: [
      {
        description: 'Email revised proposal to client',
        user_generated: false,
        completed: false,
        recording_timestamp: '00:10:45',
        recording_playback_url: 'https://fathom.video/calls/xyz123?timestamp=645',
        assignee: { name: 'Jane Doe', email: 'jane.doe@example.com', team: 'Marketing' },
      },
    ],
    calendar_invitees: [
      { name: 'Jane Doe', matched_speaker_display_name: 'Jane Doe', email: 'jane.doe@example.com', is_external: false, email_domain: 'example.com' },
      { name: 'John Smith', matched_speaker_display_name: 'John Smith', email: 'john.smith@client.example.com', is_external: true, email_domain: 'client.example.com' },
    ],
    recorded_by: { name: 'Alice Johnson', email: 'alice.johnson@example.com', team: 'Customer Success', email_domain: 'example.com' },
    crm_matches: {
      contacts: [{ name: 'John Smith', email: 'john.smith@client.example.com', record_url: 'https://app.hubspot.com/contacts/123' }],
      companies: [{ name: 'Acme Corp', record_url: 'https://app.hubspot.com/companies/456' }],
      deals: [{ name: 'Q1 Renewal', amount: 50000, record_url: 'https://app.hubspot.com/deals/789' }],
    },
  },
  outputSchema: fathomOutputSchemas.newRecording,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const includes = includeFlags({ propsValue: context.propsValue });
    if (!includes.include_transcript && !includes.include_summary && !includes.include_action_items && !includes.include_crm_matches) {
      throw new Error('Fathom needs at least one of Include Transcript, Include Summary, Include Action Items or Include CRM Matches turned on. Turn one on and publish again.');
    }
    const triggeredFor = (context.propsValue.triggered_for ?? []).filter((value): value is string => typeof value === 'string');
    if (triggeredFor.length === 0) {
      throw new Error('Pick at least one recording type in Trigger For.');
    }
    const webhook = await fathomClient.requestObject({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'webhooks',
      body: { destination_url: context.webhookUrl, triggered_for: triggeredFor, ...includes },
    });
    const webhookId = webhook['id'];
    const secret = webhook['secret'];
    if (typeof webhookId !== 'string' || webhookId.length === 0 || typeof secret !== 'string' || secret.length === 0) {
      throw new Error('Fathom created the webhook but did not return its ID and signing secret. Try publishing again.');
    }
    try {
      await context.store.put<WebhookInformation>(STORE_KEY, { webhookId, secret });
    } catch (error) {
      await deleteWebhook({ auth: context.auth, webhookId }).catch(() => undefined);
      throw error;
    }
  },
  async onDisable(context) {
    const webhookInfo = await context.store.get<WebhookInformation>(STORE_KEY);
    if (webhookInfo?.webhookId) {
      await deleteWebhook({ auth: context.auth, webhookId: webhookInfo.webhookId });
    }
    const seenKeys = fathomWebhook.seenDeliveryKeys({ seen: await context.store.get<unknown>(SEEN_KEY) });
    await Promise.all(seenKeys.map((key) => context.store.delete(claimKey({ deliveryKey: key }))));
    await context.store.delete(STORE_KEY);
    await context.store.delete(SEEN_KEY);
  },
  async test(context) {
    const includes = includeFlags({ propsValue: context.propsValue });
    const isOAuth = context.auth.type !== AppConnectionType.SECRET_TEXT;
    const page = await fathomClient.listPage({
      auth: context.auth,
      path: 'meetings',
      query: {
        include_action_items: includes.include_action_items || undefined,
        include_crm_matches: includes.include_crm_matches || undefined,
        include_summary: (!isOAuth && includes.include_summary) || undefined,
        include_transcript: (!isOAuth && includes.include_transcript) || undefined,
      },
    });
    const meetings = page.items.slice(0, 3);
    if (!isOAuth || (!includes.include_summary && !includes.include_transcript)) {
      return meetings;
    }
    const enriched = [];
    for (const meeting of meetings) {
      enriched.push(await attachRecordingContent({ auth: context.auth, meeting, includes }));
    }
    return enriched;
  },
  async run(context) {
    const webhookInfo = await context.store.get<WebhookInformation>(STORE_KEY);
    if (!webhookInfo) {
      return [];
    }
    if (!webhookInfo.secret) {
      throw new Error(
        'This Fathom trigger was turned on with an older piece version that did not save the signing secret, so this delivery cannot be verified and was not processed. Turn the flow off and on again (or publish it again) to re-register the webhook.'
      );
    }
    const verification = fathomWebhook.verifySignature({
      secret: webhookInfo.secret,
      headers: context.payload.headers ?? {},
      rawBody: context.payload.rawBody,
      nowSeconds: Math.floor(Date.now() / 1000),
    });
    if (!verification.valid) {
      return [];
    }
    const deliveryKey = fathomWebhook.deliveryKeyOf({ webhookId: verification.webhookId });
    const remembered = fathomWebhook.rememberDelivery({
      seen: await context.store.get<unknown>(SEEN_KEY),
      deliveryKey,
      timestamp: verification.timestamp,
      nowSeconds: Math.floor(Date.now() / 1000),
    });
    if (remembered.status === 'duplicate') {
      return [];
    }
    if (remembered.status === 'full') {
      throw seenListFullError();
    }
    const claimed = await claimDelivery({ store: context.store, deliveryKey, timestamp: verification.timestamp });
    if (!claimed) {
      return [];
    }
    const recorded = await recordSeen({ store: context.store, deliveryKey, timestamp: verification.timestamp });
    await Promise.all(recorded.expired.map((key) => context.store.delete(claimKey({ deliveryKey: key }))));
    if (recorded.full) {
      await context.store.delete(claimKey({ deliveryKey }));
      throw seenListFullError();
    }
    return [context.payload.body];
  },
});

async function recordSeen({
  store,
  deliveryKey,
  timestamp,
}: {
  store: Store;
  deliveryKey: string;
  timestamp: number;
}): Promise<{ full: boolean; expired: string[] }> {
  let expired: string[] = [];
  for (let attempt = 0; attempt < SEEN_WRITE_ATTEMPTS; attempt++) {
    const merged = fathomWebhook.rememberDelivery({
      seen: await store.get<unknown>(SEEN_KEY),
      deliveryKey,
      timestamp,
      nowSeconds: Math.floor(Date.now() / 1000),
    });
    expired = [...expired, ...merged.expired];
    if (merged.status !== 'new') {
      return { full: merged.status === 'full', expired };
    }
    await store.put(SEEN_KEY, merged.seen);
    const stored = await store.get<unknown>(SEEN_KEY);
    if (fathomWebhook.seenDeliveryKeys({ seen: stored }).includes(deliveryKey)) {
      return { full: false, expired };
    }
  }
  return { full: false, expired };
}

function seenListFullError(): Error {
  return new Error(
    `Fathom sent more than ${fathomWebhook.MAX_SEEN_IDS} recordings within ${fathomWebhook.TOLERANCE_SECONDS / 60} minutes, so this delivery could not be recorded for duplicate protection and was not processed.`
  );
}

async function claimDelivery({ store, deliveryKey, timestamp }: { store: Store; deliveryKey: string; timestamp: number }): Promise<boolean> {
  const key = claimKey({ deliveryKey });
  const existing = await store.get<DeliveryClaim>(key);
  if (existing) {
    return false;
  }
  const token = randomUUID();
  await store.put<DeliveryClaim>(key, { token, ts: timestamp });
  await new Promise((resolve) => setTimeout(resolve, CLAIM_SETTLE_MS));
  const winner = await store.get<DeliveryClaim>(key);
  return winner?.token === token;
}

function claimKey({ deliveryKey }: { deliveryKey: string }): string {
  return `${CLAIM_KEY_PREFIX}${deliveryKey}`;
}

function includeFlags({ propsValue }: { propsValue: Record<string, unknown> }): IncludeFlags {
  return {
    include_transcript: propsValue['include_transcript'] === true,
    include_summary: propsValue['include_summary'] === true,
    include_action_items: propsValue['include_action_items'] === true,
    include_crm_matches: propsValue['include_crm_matches'] === true,
  };
}

async function deleteWebhook({ auth, webhookId }: { auth: FathomAuthValue; webhookId: string }): Promise<void> {
  try {
    await fathomClient.request({ auth, method: HttpMethod.DELETE, path: `webhooks/${encodeURIComponent(webhookId)}` });
  } catch (error) {
    if (error instanceof FathomApiError && error.status === 404) {
      return;
    }
    throw error;
  }
}

async function attachRecordingContent({
  auth,
  meeting,
  includes,
}: {
  auth: FathomAuthValue;
  meeting: Record<string, unknown>;
  includes: IncludeFlags;
}): Promise<Record<string, unknown>> {
  const recordingId = meeting['recording_id'];
  if (typeof recordingId !== 'number') {
    return meeting;
  }
  const summary = includes.include_summary
    ? (await fathomClient.requestObject({ auth, method: HttpMethod.GET, path: `recordings/${recordingId}/summary` }))['summary']
    : undefined;
  const transcript = includes.include_transcript
    ? (await fathomClient.requestObject({ auth, method: HttpMethod.GET, path: `recordings/${recordingId}/transcript` }))['transcript']
    : undefined;
  return {
    ...meeting,
    ...(includes.include_summary ? { default_summary: summary ?? null } : {}),
    ...(includes.include_transcript ? { transcript: transcript ?? null } : {}),
  };
}

const STORE_KEY = '_new_recording_webhook';
const SEEN_KEY = '_fathom_seen_ids';
const CLAIM_KEY_PREFIX = '_fathom_delivery_';
const CLAIM_SETTLE_MS = 500;
const SEEN_WRITE_ATTEMPTS = 3;

type WebhookInformation = { webhookId: string; secret?: string };
type DeliveryClaim = { token: string; ts: number };
type IncludeFlags = {
  include_transcript: boolean;
  include_summary: boolean;
  include_action_items: boolean;
  include_crm_matches: boolean;
};
