import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxAiProps } from '../../../common/ai-props';
import { sendfoxClient } from '../../../common/client';
import { sendfoxListCampaignSectionsOutputSchema } from '../../../output-schemas';

export const listCampaignSectionsAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_list_campaign_sections',
  outputSchema: sendfoxListCampaignSectionsOutputSchema,
  displayName: 'List Campaign Sections',
  description: 'List your saved SendFox campaign sections',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns one page (20 per page) of saved campaign sections with their IDs, names and HTML. Optionally filters by name.',
    idempotent: true,
  },
  props: {
    search: sendfoxAiProps.query({ required: false, description: 'Text to filter sections by name; SQL LIKE wildcards (%) work. Leave empty to return all.' }),
    page: sendfoxAiProps.page({ required: false }),
  },
  async run(context) {
    const { propsValue } = context;
    return await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/campaign-sections',
      query: {
        ...(propsValue.search ? { q: propsValue.search } : {}),
        ...(propsValue.page !== undefined ? { page: String(propsValue.page) } : {}),
      },
    });
  },
});
