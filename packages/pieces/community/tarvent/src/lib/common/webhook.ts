import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { tarventClient, TarventWebhookEvent } from './client';
import { TarventCredentials } from './transport';

const MAX_SEEN_IDS = 200;
const SEEN_SUFFIX = '_seen_event_ids';

const BOUNCE_TYPES = ['BLOCK', 'BLOCK_CONTENT', 'BLOCK_SENDER', 'HARD', 'SOFT', 'SOFT_DNS', 'SOFT_IP', 'SOFT_SENDER_AUTH'];

function entityOf(params: WebhookParams): string | null {
  return params.entity && params.entity !== 'BOTH' ? String(params.entity) : null;
}

function webhookEvents({ type, params }: { type: TarventWebhookType; params: WebhookParams }): TarventWebhookEvent[] {
  switch (type) {
    case 'contactAdded':
      return [{ entityType: null, eventType: 'CONTACT_ADDED' }];
    case 'campaignSendFinished':
      return [{ entityType: null, eventType: 'CAMPAIGN_SENT' }];
    case 'contactBounced': {
      const entityType = entityOf(params);
      const types = !params.type || params.type === 'Any' ? BOUNCE_TYPES : [String(params.type)];
      return types.map((eventType) => ({ entityType, eventType }));
    }
    case 'contactClicked':
      return [{ entityType: entityOf(params), eventType: 'CLICK' }];
    case 'contactReplied':
      return [{ entityType: entityOf(params), eventType: 'REPLIED' }];
    case 'contactOpened':
      return [{ entityType: entityOf(params), eventType: 'OPEN' }];
    case 'contactGroupUpdated':
      return [{ entityType: null, eventType: params.action === 'Add' ? 'GROUP_ADDED' : 'GROUP_REMOVED' }];
    case 'contactNoteAdded':
      return [{ entityType: null, eventType: 'NOTE_ADDED' }];
    case 'contactStatusUpdated':
      if (!params.status || params.status === 'Any') {
        return [
          { entityType: null, eventType: 'SUBSCRIBED' },
          { entityType: null, eventType: 'UNSUBSCRIBED' },
        ];
      }
      return [{ entityType: null, eventType: params.status === 'ACTIVE' ? 'SUBSCRIBED' : 'UNSUBSCRIBED' }];
    case 'contactTagUpdated':
      return [{ entityType: null, eventType: params.action === 'Add' ? 'TAG_ADDED' : 'TAG_REMOVED' }];
    case 'contactUnsubscribed':
      return [{ entityType: null, eventType: 'UNSUBSCRIBED' }];
    case 'contactUpdated':
      return [{ entityType: null, eventType: 'FIELD_UPDATED' }];
    case 'formSubmitted':
      return [
        { entityType: 'FORM', eventType: 'SUBMITTED_COMPLETE_FORM' },
        { entityType: 'FORM', eventType: 'SUBMITTED_PARTIAL_FORM' },
      ];
    case 'landingPageCtaPerformed':
      return [{ entityType: 'PAGE', eventType: 'CTA' }];
    case 'surveySubmitted':
      return [
        { entityType: 'SURVEY', eventType: 'SUBMITTED_COMPLETE_FORM' },
        { entityType: 'SURVEY', eventType: 'SUBMITTED_PARTIAL_FORM' },
      ];
    case 'transactionCreated':
      return [{ entityType: null, eventType: 'CREATED' }];
    case 'transactionSent':
      return [{ entityType: null, eventType: 'PROCESSED' }];
  }
}

function campaignCondition({ type, params }: { type: TarventWebhookType; params: WebhookParams }): WebhookCondition[] {
  if (type !== 'contactClicked' && type !== 'contactOpened') {
    return [];
  }
  const verb = type === 'contactClicked' ? 'Clicked' : 'Opened';
  const scope = typeof params.campaignScope === 'object' && params.campaignScope !== null ? params.campaignScope : {};
  switch (params.campaignType) {
    case 'Any':
      return [{ dataFieldId: null, fieldName: `Campaign.AnyLast5.${verb}`, operator: 'IF_TRUE', value: null }];
    case 'All':
      return [{ dataFieldId: null, fieldName: `Campaign.AllLast5.${verb}`, operator: 'IF_TRUE', value: null }];
    case 'AnyX': {
      const range = Reflect.get(scope, 'campaignRange');
      const period = Reflect.get(scope, 'campaignPeriod');
      if (range === undefined || range === null || range === '' || !period) {
        throw new Error('Set the campaign scope range and period for "Any campaigns within last...".');
      }
      return [{ dataFieldId: null, fieldName: `Campaign.AnyWithinLast.${verb}`, operator: 'IF_TRUE', value: `${range}${period}` }];
    }
    case 'Specific': {
      if (!params.campaignId) {
        throw new Error('Select a campaign when the campaign type is "A specific campaign".');
      }
      const link = type === 'contactClicked' && params.linkId ? `.${params.linkId}` : '';
      return [{ dataFieldId: null, fieldName: `Campaign.${params.campaignId}.${verb}${link}`, operator: 'IF_TRUE', value: null }];
    }
    default:
      return [];
  }
}

function webhookFilter({ type, params }: { type: TarventWebhookType; params: WebhookParams }): Record<string, unknown> | null {
  const conditions: WebhookCondition[] = [
    ...(params.audienceId ? [{ dataFieldId: null, fieldName: 'audience', operator: 'IF_TRUE', value: String(params.audienceId) }] : []),
    ...(params.groupId ? [{ dataFieldId: null, fieldName: 'groups', operator: 'CONTAINS', value: String(params.groupId) }] : []),
    ...(params.tagId ? [{ dataFieldId: null, fieldName: 'tags', operator: 'CONTAINS', value: String(params.tagId) }] : []),
    ...campaignCondition({ type, params }),
    ...(type === 'contactStatusUpdated' && params.status && params.status !== 'Any'
      ? [{ dataFieldId: null, fieldName: 'Status', operator: 'EQUAL', value: String(params.status) }]
      : []),
    ...(type === 'formSubmitted' && params.formId ? [{ dataFieldId: null, fieldName: `Form.${params.formId}.Submitted`, operator: 'IF_TRUE', value: null }] : []),
    ...(type === 'landingPageCtaPerformed' && params.landingPageId ? [{ dataFieldId: null, fieldName: `Page.${params.landingPageId}.CTA`, operator: 'IF_TRUE', value: null }] : []),
    ...(type === 'surveySubmitted' && params.surveyId ? [{ dataFieldId: null, fieldName: `Survey.${params.surveyId}.Submitted`, operator: 'IF_TRUE', value: null }] : []),
  ];
  return conditions.length === 0 ? null : { operator: 'AND', conditions, conditionGroups: [] };
}

function storedWebhookId(stored: unknown): string | undefined {
  if (typeof stored === 'string') {
    return stored.length > 0 ? stored : undefined;
  }
  if (typeof stored !== 'object' || stored === null) {
    return undefined;
  }
  const direct: unknown = Reflect.get(stored, 'id');
  if (typeof direct === 'string') {
    return direct;
  }
  const data: unknown = Reflect.get(stored, 'data');
  const created: unknown = typeof data === 'object' && data !== null ? Reflect.get(data, 'createWebhook') : undefined;
  const legacyId: unknown = typeof created === 'object' && created !== null ? Reflect.get(created, 'id') : undefined;
  return typeof legacyId === 'string' ? legacyId : undefined;
}

function rememberEvent({ seen, eventId }: { seen: unknown; eventId: string }): { duplicate: boolean; seen: string[] } {
  const ids = Array.isArray(seen) ? seen.filter((id): id is string => typeof id === 'string') : [];
  if (ids.includes(eventId)) {
    return { duplicate: true, seen: ids };
  }
  return { duplicate: false, seen: [...ids, eventId].slice(-MAX_SEEN_IDS) };
}

function handlers({ type, storeKey }: { type: TarventWebhookType; storeKey: string }) {
  return {
    async onEnable(context: EnableContext): Promise<void> {
      const params: WebhookParams = context.propsValue ?? {};
      const created = await tarventClient.createWebhook({
        auth: context.auth.props,
        name: `ActivePieces-${Date.now()}`,
        callBackUrl: context.webhookUrl,
        events: webhookEvents({ type, params }),
        filter: webhookFilter({ type, params }),
        dataSettings: params.include ? String(params.include) : 'BASIC',
      });
      try {
        await context.store.put(storeKey, { id: created.id });
      } catch (error) {
        await tarventClient.deleteWebhook({ auth: context.auth.props, id: created.id }).catch(() => undefined);
        throw error;
      }
    },
    async onDisable(context: DisableContext): Promise<void> {
      const webhookId = storedWebhookId(await context.store.get<unknown>(storeKey));
      if (webhookId) {
        await tarventClient.deleteWebhook({ auth: context.auth.props, id: webhookId });
      }
      await context.store.delete(storeKey);
      await context.store.delete(`${storeKey}${SEEN_SUFFIX}`);
    },
    async run(context: RunContext): Promise<unknown[]> {
      const body = context.payload.body;
      if (typeof body !== 'object' || body === null) {
        return [];
      }
      const eventId: unknown = Reflect.get(body, 'id');
      if (typeof eventId === 'string' && eventId.length > 0) {
        const remembered = rememberEvent({ seen: await context.store.get<unknown>(`${storeKey}${SEEN_SUFFIX}`), eventId });
        if (remembered.duplicate) {
          return [];
        }
        await context.store.put(`${storeKey}${SEEN_SUFFIX}`, remembered.seen);
        return [{ ...body, [DEDUPE_KEY_PROPERTY]: eventId }];
      }
      return [body];
    },
  };
}

export const tarventWebhook = { webhookEvents, webhookFilter, storedWebhookId, rememberEvent, handlers, MAX_SEEN_IDS };

export type TarventWebhookType =
  | 'contactAdded'
  | 'campaignSendFinished'
  | 'contactBounced'
  | 'contactClicked'
  | 'contactReplied'
  | 'contactOpened'
  | 'contactGroupUpdated'
  | 'contactNoteAdded'
  | 'contactStatusUpdated'
  | 'contactTagUpdated'
  | 'contactUnsubscribed'
  | 'contactUpdated'
  | 'formSubmitted'
  | 'landingPageCtaPerformed'
  | 'surveySubmitted'
  | 'transactionCreated'
  | 'transactionSent';

type WebhookParams = {
  [K in 'entity' | 'type' | 'action' | 'status' | 'campaignType' | 'campaignScope' | 'campaignId' | 'linkId' | 'audienceId' | 'groupId' | 'tagId' | 'formId' | 'landingPageId' | 'surveyId' | 'include']?: unknown;
};

type WebhookCondition = { dataFieldId: null; fieldName: string; operator: string; value: string | null };

type WebhookStore = {
  put<T>(key: string, value: T): Promise<T>;
  get<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
};

type EnableContext = {
  auth: { props: TarventCredentials };
  propsValue?: Record<string, unknown>;
  webhookUrl: string;
  store: WebhookStore;
};

type DisableContext = {
  auth: { props: TarventCredentials };
  store: WebhookStore;
};

type RunContext = {
  payload: { body: unknown };
  store: WebhookStore;
};
