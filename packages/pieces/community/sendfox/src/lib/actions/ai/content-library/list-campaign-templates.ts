import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxAiProps } from '../../../common/ai-props';
import { sendfoxClient } from '../../../common/client';
import { sendfoxListCampaignTemplatesOutputSchema } from '../../../output-schemas';

export const listCampaignTemplatesAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_list_campaign_templates',
  outputSchema: sendfoxListCampaignTemplatesOutputSchema,
  displayName: 'List Campaign Templates',
  description: 'List your saved SendFox campaign templates',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns one page (20 per page) of saved campaign templates with their IDs, names and HTML. Optionally filters by name.',
    idempotent: true,
  },
  props: {
    search: sendfoxAiProps.query({ required: false, description: 'Text to filter templates by name; SQL LIKE wildcards (%) work. Leave empty to return all.' }),
    page: sendfoxAiProps.page({ required: false }),
  },
  async run(context) {
    const { propsValue } = context;
    return await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/campaign-templates',
      query: {
        ...(propsValue.search ? { q: propsValue.search } : {}),
        ...(propsValue.page !== undefined ? { page: String(propsValue.page) } : {}),
      },
    });
  },
});
