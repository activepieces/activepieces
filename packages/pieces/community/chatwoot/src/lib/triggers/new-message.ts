import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { chatwootAuth } from '../../index';
import { chatwootEndpoints, CHATWOOT_AUTH_HEADER } from '../common/constants';
import {
  getChatwootAuth,
  ChatwootWebhookPayload,
  ChatwootWebhookResponse,
  ChatwootParsedMessage,
} from '../common/types';

const WEBHOOK_STORE_KEY = '_chatwoot_webhook_id';

function normalizeUrl(u: string | undefined): string {
  if (u == null || typeof u !== 'string') return '';
  return u.trim().replace(/\/+$/, '');
}

function toWebhookList(raw: unknown): { id: number; url?: string }[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    // Top-level array keys
    for (const key of ['payload', 'data', 'webhooks']) {
      const v = o[key];
      if (Array.isArray(v)) return v;
    }
    // Chatwoot returns { payload: { webhooks: [...] } }
    const payload = o['payload'];
    if (payload && typeof payload === 'object') {
      const p = payload as Record<string, unknown>;
      const w = p['webhooks'];
      if (Array.isArray(w)) return w;
    }
    const data = o['data'];
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>;
      const w = d['webhooks'];
      if (Array.isArray(w)) return w;
    }
  }
  return [];
}

export const newMessage = createTrigger({
  auth: chatwootAuth,
  name: 'new_message',
  displayName: 'New Incoming Message',
  description:
    'Triggers when a contact sends a new message in a Chatwoot conversation',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    messageId: 42,
    content: 'Hello, I need help with my order',
    messageType: 'incoming',
    conversationId: 7,
    contactId: 15,
    contactName: 'Jane Doe',
    accountId: 1,
    createdAt: '2024-06-15 10:30:00 UTC',
  } as ChatwootParsedMessage,

  async onEnable(context) {
    const authValue = getChatwootAuth(context.auth);
    const endpoints = chatwootEndpoints(
      authValue.baseUrl,
      authValue.accountId,
    );

    const webhookUrl = context.webhookUrl;

    // List existing webhooks and reuse if this URL is already registered (avoids 422 "Url has already been taken")
    let webhookId: number;
    try {
      const listRes = await httpClient.sendRequest<unknown>({
        method: HttpMethod.GET,
        url: endpoints.WEBHOOKS,
        headers: {
          [CHATWOOT_AUTH_HEADER]: authValue.apiAccessToken,
        },
      });
      const list = toWebhookList(listRes.body);
      const targetUrl = normalizeUrl(webhookUrl);
      const existing = list.find((w) => normalizeUrl(w.url) === targetUrl);
      if (existing) {
        webhookId = existing.id;
        console.log(`[Chatwoot] Reusing existing webhook (id: ${webhookId}) for: ${webhookUrl}`);
      } else {
        const createRes = await httpClient.sendRequest<ChatwootWebhookResponse>({
          method: HttpMethod.POST,
          url: endpoints.WEBHOOKS,
          headers: {
            [CHATWOOT_AUTH_HEADER]: authValue.apiAccessToken,
            'Content-Type': 'application/json',
          },
          body: {
            url: webhookUrl,
            subscriptions: ['message_created'],
          },
        });
        webhookId = createRes.body.id;
        console.log(`[Chatwoot] Webhook created successfully (id: ${webhookId})`);
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const body = (err as { response?: { body?: unknown } })?.response?.body;
      if (status === 422 && body && typeof body === 'object' && 'message' in body && (body as { message?: string }).message?.includes('already been taken')) {
        // List might have failed or returned different shape; try listing again with generic type
        const listRes = await httpClient.sendRequest<unknown>({
          method: HttpMethod.GET,
          url: endpoints.WEBHOOKS,
          headers: { [CHATWOOT_AUTH_HEADER]: authValue.apiAccessToken },
        });
        const list = toWebhookList(listRes.body);
        const targetUrl = normalizeUrl(webhookUrl);
        const existing = list.find((w) => normalizeUrl(w.url) === targetUrl);
        if (existing?.id) {
          webhookId = existing.id;
          console.log(`[Chatwoot] Reusing existing webhook (id: ${webhookId}) after 422`);
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    await context.store.put(WEBHOOK_STORE_KEY, { webhookId });
  },

  async onDisable(context) {
    const authValue = getChatwootAuth(context.auth);
    const endpoints = chatwootEndpoints(
      authValue.baseUrl,
      authValue.accountId,
    );

    const stored = await context.store.get<{ webhookId: number }>(
      WEBHOOK_STORE_KEY,
    );

    if (!stored?.webhookId) {
      console.log('[Chatwoot] No stored webhook ID to delete');
      return;
    }

    console.log(
      `[Chatwoot] Deleting webhook (id: ${stored.webhookId})`,
    );

    try {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: endpoints.WEBHOOK_BY_ID(stored.webhookId),
        headers: {
          [CHATWOOT_AUTH_HEADER]: authValue.apiAccessToken,
        },
      });
      console.log('[Chatwoot] Webhook deleted successfully');
    } catch (error) {
      console.error('[Chatwoot] Error deleting webhook:', error);
    }

    await context.store.delete(WEBHOOK_STORE_KEY);
  },

  async run(context) {
    // Engine passes TriggerPayload: { body, headers, queryParams }. Chatwoot POST body may be raw or wrapped in .payload
    const rawBody = context.payload?.body;
    const payload = (rawBody && typeof rawBody === 'object' && 'payload' in rawBody)
      ? (rawBody as { payload: ChatwootWebhookPayload })['payload']
      : (rawBody as ChatwootWebhookPayload | undefined);

    if (!payload || typeof payload !== 'object') {
      console.log('[Chatwoot] No payload or invalid body received');
      return [];
    }

    const event = payload['event'];
    console.log(`[Chatwoot] Received webhook event: ${event}`);

    if (event !== 'message_created') {
      console.log(
        `[Chatwoot] Ignoring non-message event: ${event}`,
      );
      return [];
    }

    const messageType = payload['message_type'];
    if (messageType !== 'incoming') {
      console.log(
        `[Chatwoot] Ignoring non-incoming message (type: ${messageType}) to avoid reply loops`,
      );
      return [];
    }

    const content = payload['content'];
    if (content == null || String(content).trim().length === 0) {
      console.log('[Chatwoot] Ignoring message with empty content');
      return [];
    }

    const conversation = payload['conversation'];
    const contact = payload['contact'];
    const sender = payload['sender'];
    const account = payload['account'];
    
    // Chatwoot sends conversation.id (not display_id) in webhook payloads
    // Try display_id first (for API compatibility), then fall back to id
    let conversationId = 0;
    if (conversation != null && typeof conversation === 'object') {
      if ('display_id' in conversation) {
        const displayId = (conversation as { display_id: unknown })['display_id'];
        conversationId = displayId != null ? Number(displayId) || 0 : 0;
      } else if ('id' in conversation) {
        const id = (conversation as { id: unknown })['id'];
        conversationId = id != null ? Number(id) || 0 : 0;
      }
    }
    
    // Contact info may be in 'contact' or 'sender' field
    const contactObj = contact || sender;
    const contactId = contactObj != null && typeof contactObj === 'object' && 'id' in contactObj
      ? Number((contactObj as { id: unknown })['id']) || 0
      : 0;
    const contactName = contactObj != null && typeof contactObj === 'object' && 'name' in contactObj
      ? String((contactObj as { name: unknown })['name'])
      : 'Unknown';
    const accountId = account != null && typeof account === 'object' && 'id' in account
      ? Number((account as { id: unknown })['id']) || 0
      : 0;
    const messageId = typeof payload['id'] === 'number' ? payload['id'] : Number(payload['id']) || 0;
    const createdAt = payload['created_at'] != null ? String(payload['created_at']) : '';

    const parsed: ChatwootParsedMessage = {
      messageId,
      content: String(content).trim(),
      messageType: 'incoming',
      conversationId,
      contactId,
      contactName,
      accountId,
      createdAt,
    };

    console.log(
      `[Chatwoot] Parsed incoming message from ${parsed.contactName} in conversation ${parsed.conversationId}: "${parsed.content}"`,
    );

    return [parsed];
  },
});
