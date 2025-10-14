import { SimplybookAuth, makeJsonRpcCall } from './auth';

export type WebhookNotificationType = 'create' | 'cancel' | 'new_client' | 'change' | 'create_invoice';

/**
 * Subscribe to webhook notifications
 * @param auth - SimplybookAuth object
 * @param url - Webhook URL to receive notifications
 * @param notificationType - Type of notification to subscribe to
 * @returns Boolean indicating success
 */
export async function subscribeWebhook(
  auth: SimplybookAuth,
  url: string,
  notificationType: WebhookNotificationType
): Promise<boolean> {
  const params = [url, notificationType];
  const result = await makeJsonRpcCall<boolean>(auth, 'pluginZapierSubscribe', params);
  return result;
}

/**
 * Get last notification update datetime
 * @param auth - SimplybookAuth object
 * @param type - Notification type
 * @returns Last update datetime string
 */
export async function getLastNotificationUpdate(
  auth: SimplybookAuth,
  type: WebhookNotificationType
): Promise<string> {
  const params = [type];
  const result = await makeJsonRpcCall<string>(auth, 'getLastNotificationUpdate', params);
  return result;
}
