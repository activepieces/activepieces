import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { sendrApiCall } from '../common';

export const contactPageEngagementCreated = createTrigger({
  auth: sendrAuth,
  name: 'contact_page_engagement_created',
  displayName: 'New Contact Page Engagement',
  description: 'Triggers when a contact visits a Sendr Page for the first time.',
  props: {},
  sampleData: {
    event_type: 'contact_page_engagement:created',
    page_id: 'cuid_example',
    page_slug: 'example-slug',
    page_url: 'https://pages.sendr.io/example',
    attributes: JSON.stringify({ first_name: 'John', company: 'Acme' }),
    timestamp: '2026-04-24T14:00:00Z',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    try {
      await sendrApiCall({
        token: context.auth as unknown as string,
        method: HttpMethod.POST,
        path: '/webhook',
        body: {
          name: 'Activepieces - New Contact Page Engagement',
          url: context.webhookUrl,
          events: ['contact_page_engagement:created'],
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
      event_type: body.event ?? 'contact_page_engagement:created',
      page_id: body.pageId ?? null,
      page_slug: body.pageSlug ?? null,
      page_url: body.pageUrl ?? null,
      attributes: body.attributes ? JSON.stringify(body.attributes) : null,
      timestamp: body.timestamp ?? null,
    }];
  },

  async test(context) {
    return [
      {
        event_type: 'contact_page_engagement:created',
        page_id: 'test_cuid_page',
        page_slug: 'test-slug',
        page_url: 'https://pages.sendr.io/test',
        attributes: JSON.stringify({ first_name: 'John', company: 'Acme' }),
        timestamp: '2026-04-24T14:00:00Z',
      },
    ];
  },
});
