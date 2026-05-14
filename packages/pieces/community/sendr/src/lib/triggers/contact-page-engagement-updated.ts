import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { sendrApiCall } from '../common';

export const contactPageEngagementUpdated = createTrigger({
  auth: sendrAuth,
  name: 'contact_page_engagement_updated',
  displayName: 'Contact Page Engagement Updated',
  description: 'Triggers when a contact interacts with a Sendr Page again (e.g. replays, re-visits).',
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
    try {
      await sendrApiCall({
        token: context.auth as unknown as string,
        method: HttpMethod.POST,
        path: '/webhook',
        body: {
          name: 'Activepieces - Contact Page Engagement Updated',
          url: context.webhookUrl,
          events: ['contact_page_engagement:updated'],
        },
      });
      await context.store.put('webhookUrl', context.webhookUrl);
    } catch (e) {
      throw new Error('Failed to register Sendr webhook: ' + (e as Error).message);
    }
  },

  async onDisable(context) {
    try {
      const webhookUrl = await context.store.get<string>('webhookUrl');
      if (webhookUrl) {
        await sendrApiCall({
          token: context.auth as unknown as string,
          method: HttpMethod.DELETE,
          path: '/webhook',
          body: { url: webhookUrl },
        });
      }
    } catch (e) {
      throw new Error('Failed to unregister Sendr webhook: ' + (e as Error).message);
    }
    await context.store.delete('webhookUrl');
  },

  async run(context) {
    const body = context.payload.body as Record<string, unknown>;
    return [{
      event_type: body.event ?? 'contact_page_engagement:updated',
      page_id: body.pageId ?? null,
      page_slug: body.pageSlug ?? null,
      page_url: body.pageUrl ?? null,
      attributes: body.attributes ? JSON.stringify(body.attributes) : null,
      event_status: body.eventStatus ?? null,
      timestamp: body.timestamp ?? null,
    }];
  },

  async test(context) {
    return [
      {
        event_type: 'contact_page_engagement:updated',
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
