import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { extractCollection, replyIoRequest } from './client';

export const campaignIdProp = Property.Dropdown({
  displayName: 'Campaign',
  description: 'The Reply.io campaign to use.',
  required: true,
  refreshers: [],
  auth: replyIoAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Reply.io account first.',
        options: [],
      };
    }

    const response = await replyIoRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/v1/campaigns',
    });

    const campaigns = extractCollection<{ id?: string | number; name?: string }>(response.body);

    return {
      disabled: false,
      options: campaigns
        .filter((campaign) => campaign.id !== undefined && campaign.id !== null)
        .map((campaign) => ({
          label: campaign.name ?? String(campaign.id),
          value: String(campaign.id),
        })),
    };
  },
});
