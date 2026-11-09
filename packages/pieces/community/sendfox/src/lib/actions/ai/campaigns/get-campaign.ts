import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxAiProps } from '../../../common/ai-props';
import { sendfoxClient } from '../../../common/client';
import { sendfoxGetCampaignOutputSchema } from '../../../output-schemas';

export const getCampaignAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_get_campaign',
  outputSchema: sendfoxGetCampaignOutputSchema,
  displayName: 'Get Campaign',
  description: 'Get one SendFox campaign',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one campaign by ID with its title, subject, preview text, HTML, sender and scheduled and sent times. Campaign IDs come from List Campaigns.',
    idempotent: true,
  },
  props: {
    campaignId: sendfoxAiProps.campaignId({ required: true }),
  },
  async run(context) {
    const { propsValue } = context;
    return await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/campaigns/${encodeURIComponent(propsValue.campaignId)}`,
    });
  },
});
