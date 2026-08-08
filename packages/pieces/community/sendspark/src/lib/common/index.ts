import { HttpMethod, HttpMessageBody, HttpResponse, httpClient } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { sendsparkAuth } from '../auth';

const BASE_URL = 'https://api-gw.sendspark.com/v1';

function sendsparkApiCall<T extends HttpMessageBody>({
  apiKey,
  apiSecret,
  method,
  path,
  body,
}: {
  apiKey: string;
  apiSecret: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
}): Promise<HttpResponse<T>> {
  return httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'x-api-key': apiKey,
      'x-api-secret': apiSecret,
      Accept: 'application/json',
    },
    body,
  });
}

const dynamicCampaignDropdown = Property.Dropdown({
  displayName: 'Dynamic Campaign',
  description: 'The dynamic campaign to generate a personalized video for.',
  auth: sendsparkAuth,
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Connect your Sendspark account first' };
    }
    try {
      const response = await sendsparkApiCall<{
        response: { data: { _id: string; name: string }[] };
      }>({
        apiKey: auth.props.api_key,
        apiSecret: auth.props.api_secret,
        method: HttpMethod.GET,
        path: `/workspaces/${auth.props.workspace_id}/dynamics`,
      });
      const campaigns = response.body.response?.data ?? [];
      return {
        disabled: false,
        options: campaigns.map((c) => ({ label: c.name, value: c._id })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load campaigns. Check your connection.' };
    }
  },
});

export const sendsparkCommon = {
  sendsparkApiCall,
  dynamicCampaignDropdown,
};
