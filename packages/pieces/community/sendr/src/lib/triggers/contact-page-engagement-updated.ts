import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { sendrApiCall } from '../common';

export const contactPageEngagementUpdated = createTrigger({
  auth: sendrAuth,
  name: 'contact_page_engagement_updated',
  displayName: 'Contact Page Engagement Updated',
  description: 'Triggers when a contact interacts with a Sendr Page again (e.g. replays, re-visits).',
  aiMetadata: {
    description: 'Fires on subsequent engagement when a contact interacts with a Sendr Page again (re-visit or replay), delivering the page id/slug/URL, contact attributes, and engagement status. Use it to track repeat interaction after the initial visit.',
  },
  props: {},
  sampleData: {
    event_type: 'contact_page_engagement:updated',
    page_id: 'cuid_example',
    page_slug: 'example-slug',
    page_url: 'https://pages.sendr.io/example',
    attributes: JSON.stringify({ first_name: 'John', company: 'Acme' }),
    event_status: 'engaged',
    timestamp: '2026-04-24T14:05:00Z',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    // Best-effort cleanup of stale registration from a prior lifecycle
    const oldUrl = await context.store.get<string>('webhookUrl');
    if (oldUrl) {
      try {
        await sendrApiCall({
          token: context.auth.secret_text,
          method: HttpMethod.DELETE,
          path: '/webhook',
          body: { url: oldUrl },
        });
      } catch {
        // Swallow — cleanup is best-effort
      }
      await context.store.delete('webhookUrl');
    }
    // Register new webhook
    try {
      await sendrApiCall({
        token: context.auth.secret_text,
        method: HttpMethod.POST,
        path: '/webhook',
        body: {
          name: 'Activepieces - Contact Page Engagement Updated',
          url: context.webhookUrl,
          events: ['contact_page_engagement.updated'],
        },
      });
      await context.store.put('webhookUrl', context.webhookUrl);
      // Fetch webhook secret for payload verification
      try {
        const secretResp = await sendrApiCall<{ secret: string }>({
          token: context.auth.secret_text,
          method: HttpMethod.POST,
          path: '/webhook/reveal-secret',
          body: { url: context.webhookUrl },
        });
        if (secretResp.body?.secret) {
          await context.store.put('webhookSecret', secretResp.body.secret);
        }
      } catch {
        // Reveal may fail if not supported — webhook still works without verification
      }
    } catch (e) {
      throw new Error('Failed to register Sendr webhook: ' + (e as Error).message);
    }
  },

  async onDisable(context) {
    try {
      const webhookUrl = await context.store.get<string>('webhookUrl');
      if (webhookUrl) {
        await sendrApiCall({
          token: context.auth.secret_text,
          method: HttpMethod.DELETE,
          path: '/webhook',
          body: { url: webhookUrl },
        });
      }
    } catch (e) {
      throw new Error('Failed to unregister Sendr webhook: ' + (e as Error).message);
    } finally {
      await context.store.delete('webhookUrl');
      await context.store.delete('webhookSecret');
    }
  },

  async run(context) {
    // Verify webhook signature if secret is available
    const webhookSecret = await context.store.get<string>('webhookSecret');
    if (webhookSecret) {
      const headers = (context.payload.headers || {}) as Record<string, string>;
      const receivedSecret = headers['x-webhook-secret'];
      if (receivedSecret !== webhookSecret) {
        return []; // Silent rejection — signature mismatch
      }
    }
    const body = context.payload.body as Record<string, unknown>;
    return [{
      event_type: body['event'] ?? 'contact_page_engagement.updated',
      page_id: body['pageId'] ?? null,
      page_slug: body['pageSlug'] ?? null,
      page_url: body['pageUrl'] ?? null,
      attributes: body['attributes'] ? JSON.stringify(body['attributes']) : null,
      event_status: body['eventStatus'] ?? null,
      timestamp: body['timestamp'] ?? null,
    }];
  },

  async test(context) {
    return [
      {
        event_type: 'contact_page_engagement.updated',
        page_id: 'test_cuid_page',
        page_slug: 'test-slug',
        page_url: 'https://pages.sendr.io/test',
        attributes: JSON.stringify({ first_name: 'John', company: 'Acme' }),
        event_status: 'engaged',
        timestamp: '2026-04-24T14:05:00Z',
      },
    ];
  },
});
