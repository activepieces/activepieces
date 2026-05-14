import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { sendrApiCall } from '../common';

export const pageRenderCreated = createTrigger({
  auth: sendrAuth,
  name: 'page_render_created',
  displayName: 'New Page Render',
  description: 'Triggers when a new Sendr Page is rendered.',
  props: {},
  sampleData: {
    event_type: 'page_render:created',
    page_id: 'cuid_example',
    page_url: 'https://pages.sendr.io/example',
    page_slug: 'example-slug',
    template_id: 'cuid_template',
    event_status: 'created',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    try {
      await sendrApiCall({
        token: context.auth as unknown as string,
        method: HttpMethod.POST,
        path: '/webhook',
        body: {
          name: 'Activepieces - New Page Render',
          url: context.webhookUrl,
          events: ['page_render:created'],
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
      event_type: body.event ?? 'page_render:created',
      page_id: body.pageId ?? null,
      page_url: body.pageUrl ?? null,
      page_slug: body.pageSlug ?? null,
      template_id: body.templateId ?? null,
      event_status: body.eventStatus ?? null,
    }];
  },

  async test(context) {
    return [
      {
        event_type: 'page_render:created',
        page_id: 'test_cuid_page',
        page_url: 'https://pages.sendr.io/test',
        page_slug: 'test-slug',
        template_id: 'test_cuid_template',
        event_status: 'created',
      },
    ];
  },
});
