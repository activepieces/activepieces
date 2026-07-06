import { HttpMethod, httpClient } from '@activepieces/pieces-common';
export const baseUrl = 'https://pollybot.app/api/v1';

export const leadStatusOptions = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  converted: 'Converted',
  lost: 'Lost',
  follow_up: 'Follow Up',
};

// Helper to format error messages exactly like your Zapier handleApiError
export function formatError(e: unknown): string {
  const error = e as {
    response?: {
      status?: number;
      body?: {
        error?: string;
        details?: unknown;
      };
    };
    message?: string;
  };

  const status = error.response?.status;
  const errorData = error.response?.body || {};
  const message = errorData.error || error.message || 'Unknown Error';
  const details = errorData.details ? JSON.stringify(errorData.details) : '';

  return `Error (${status}): ${message}. ${details}`;
}

// // Webhook Subscription Helpers
// export const pollybotCommon = {
//   // Updated to return both webhookId and secret
//   subscribeWebhook: async (
//     chatbotId: string,
//     apiKey: string,
//     webhookUrl: string
//   ): Promise<{ webhookId: string; secret: string }> => {
//     const response = await httpClient.sendRequest({
//       method: HttpMethod.POST,
//       url: `${baseUrl}/chatbots/${chatbotId}/webhooks`,
//       headers: {
//         Authorization: `Bearer ${apiKey}`,
//       },
//       body: {
//         name: `Activepieces - New Lead (${new Date().toISOString()})`,
//         url: webhookUrl,
//         eventTypes: ['LEAD_CREATED'],
//         maxRetries: 3,
//         retryDelay: 1000,
//       },
//     }); // PollyBot returns { webhook: { id: "...", secret: "..." }, ... } or just { id: "...", secret: "..." }

//     const body = response.body;
//     const webhook = body.webhook || body;

//     return {
//       webhookId: webhook.id,
//       secret: webhook.secret, // Extract and return the secret
//     };
//   },

//   unsubscribeWebhook: async (
//     chatbotId: string,
//     apiKey: string,
//     webhookId: string
//   ): Promise<void> => {
//     await httpClient.sendRequest({
//       method: HttpMethod.DELETE,
//       url: `${baseUrl}/chatbots/${chatbotId}/webhooks/${webhookId}`,
//       headers: {
//         Authorization: `Bearer ${apiKey}`,
//       },
//     });
//   },
// };
