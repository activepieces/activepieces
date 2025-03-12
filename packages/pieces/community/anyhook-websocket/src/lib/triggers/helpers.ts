import { websocketCommon } from '../common/common';

export async function createWebsocketSubscription(
  websocketUrl: string,
  headers: Record<string, unknown> | undefined,
  message: Record<string, unknown>,
  webhookUrl: string,
  proxyBaseUrl: string
) {
  const subscriptionApiUrl = `${proxyBaseUrl}/subscribe`;
  const data = {
    connection_type: websocketCommon.connectionType,
    webhook_url: webhookUrl,
    args: {
      endpoint_url: websocketUrl,
      headers: headers ? JSON.stringify(headers) : undefined,
      message,
    },
  };
  const response = await websocketCommon.apiCall(subscriptionApiUrl, 'POST', data);
  return response;
}

export async function deleteWebsocketSubscription(subscriptionId: string, proxyBaseUrl: string) {
  const deleteApiUrl = `${proxyBaseUrl}/unsubscribe`;
  const data = {
    subscription_id: subscriptionId,
  };
  const response = await websocketCommon.apiCall(deleteApiUrl, 'POST', data);
  return response;
}
