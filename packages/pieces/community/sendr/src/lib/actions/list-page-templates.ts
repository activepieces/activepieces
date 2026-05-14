import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { sendrApiCall } from '../common';

export const listPageTemplates = createAction({
  auth: sendrAuth,
  name: 'list_page_templates',
  displayName: 'List Page Templates',
  description: 'Lists all available Sendr Page templates you can use to create personalized landing pages.',
  props: {},
  async run(context) {
    const response = await sendrApiCall<{
      templates: { id: string; name?: string; createdAt?: string; [key: string]: unknown }[];
    }>({
      token: context.auth as unknown as string,
      method: HttpMethod.GET,
      path: '/page-template/list',
    });
    const templates = response.body?.templates ?? [];
    return templates.map((t) => ({
      id: t.id,
      name: t.name ?? null,
      created_at: t.createdAt ?? null,
    }));
  },
});
