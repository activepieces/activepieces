import { Property } from '@activepieces/pieces-framework';
import { voucheryIoAuth } from './auth';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const comapaignIdDropdown = Property.Dropdown({
  auth: voucheryIoAuth,
  displayName: 'Campaign',
  description: 'Select the campaign',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
      };
    }
    const response = await makeRequest(
      auth?.secret_text,
      HttpMethod.GET,
      `/campaigns`
    ) as any[];
    return {
      disabled: false,
      options: response.map((campaign ) => ({
        label: campaign.name,
        value: campaign.id,
      })),
    };
  },
});
