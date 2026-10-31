import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxAiProps } from '../../../common/ai-props';
import { sendfoxClient } from '../../../common/client';
import { sendfoxListCampaignsOutputSchema } from '../../../output-schemas';

export const listCampaignsAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_list_campaigns',
  outputSchema: sendfoxListCampaignsOutputSchema,
  displayName: 'List Campaigns',
  description: 'List the email campaigns in your SendFox account',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns one page of campaigns with their IDs, titles, subjects, senders and scheduled and sent times. Use it to find a campaign ID for Get Campaign or Get Campaign Stats.',
    idempotent: true,
  },
  props: {
    page: sendfoxAiProps.page({ required: false }),
  },
  async run(context) {
    const { propsValue } = context;
    return await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/campaigns',
      query: {
        ...(propsValue.page !== undefined ? { page: String(propsValue.page) } : {}),
      },
    });
  },
});
