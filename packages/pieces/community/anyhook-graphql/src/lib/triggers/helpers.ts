import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { graphqlCommon } from '../common/common';

export async function createGraphQLSubscription(
  websocketUrl: string,
  headers: Record<string, unknown> | undefined,
  query: string,
  webhookUrl: string,
  proxyBaseUrl: string
) {
  const subscriptionApiUrl = `${proxyBaseUrl}/subscribe`;
  const data = {
    connection_type: graphqlCommon.connectionType,
    webhook_url: webhookUrl,
    args: {
      endpoint_url: websocketUrl,
      headers: headers ? JSON.stringify(headers) : undefined,
      query,
    },
  };
  const response = await graphqlCommon.apiCall(subscriptionApiUrl, 'POST', data);
  return response;
}

export async function deleteGraphQLSubscription(subscriptionId: string, proxyBaseUrl: string) {
  const deleteApiUrl = `${proxyBaseUrl}/unsubscribe`;
  const data = {
    subscription_id: subscriptionId,
  };
  const response = await graphqlCommon.apiCall(deleteApiUrl, 'POST', data);
  return response;
}
