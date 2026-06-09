import { HttpMethod, httpClient, HttpRequest } from '@activepieces/pieces-common';
import { Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { TriggerHookContext } from '@activepieces/pieces-framework';
import { woodpeckerAuth } from '../..';

export const API_BASE_URL = 'https://api.woodpecker.co/rest';

export const WEBHOOK_EVENTS = {
  PROSPECT_REPLIED: 'prospect_replied',
  PROSPECT_BLACKLISTED: 'prospect_blacklisted',
  PROSPECT_OPTOUT: 'prospect_opt_out',
  PROSPECT_BOUNCED: 'prospect_bounced',
  PROSPECT_INVALID: 'prospect_invalid',
  PROSPECT_AUTOREPLIED: 'prospect_autoreplied',
  PROSPECT_SAVED: 'prospect_saved',
  PROSPECT_NONRESPONSIVE: 'prospect_non_responsive',
  LINK_CLICKED: 'link_clicked',
  EMAIL_OPENED: 'email_opened',
  PROSPECT_INTERESTED: 'prospect_interested',
  PROSPECT_MAYBE_LATER: 'prospect_maybe_later',
  PROSPECT_NOT_INTERESTED: 'prospect_not_interested',
  EMAIL_SENT: 'campaign_sent',
  FOLLOWUP_AFTER_AUTOREPLY: 'followup_after_autoreply',
  SECONDARY_REPLIED: 'secondary_replied',
  CAMPAIGN_COMPLETED: 'campaign_completed',
  TASK_CREATED: 'task_created',
  TASK_DONE: 'task_done',
  TASK_IGNORED: 'task_ignored',
} as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];

export async function subscribeWebhook(
  auth: string,
  webhookUrl: string,
  event: WebhookEvent
): Promise<void> {
  await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `${API_BASE_URL}/v1/webhooks/subscribe`,
    headers: {
      'x-api-key': auth,
      'Content-Type': 'application/json',
    },
    body: {
      target_url: webhookUrl,
      event: event,
    },
  });
}

export async function unsubscribeWebhook(
  auth: string,
  webhookUrl: string,
  event: WebhookEvent
): Promise<void> {
  await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `${API_BASE_URL}/v1/webhooks/unsubscribe`,
    headers: {
      'x-api-key': auth,
      'Content-Type': 'application/json',
    },
    body: {
      target_url: webhookUrl,
      event: event,
    },
  });
}

type Campaign = {
  id: number;
  name: string;
  status: string;
};

export const campaignsDropdown = Property.Dropdown({
  displayName: 'Campaign',
  description: 'Select the campaign to add prospects to',
  required: true,
  refreshers: [],
  auth: woodpeckerAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please authenticate first',
      };
    }
    const response = await httpClient.sendRequest<Campaign[]>({
      method: HttpMethod.GET,
      url: `${API_BASE_URL}/v1/campaign_list`,
      headers: {
        'x-api-key': auth.secret_text,
      },
    });
    const campaigns = response.body ?? [];
    return {
      disabled: false,
      options: campaigns.map((campaign) => ({
        label: `${campaign.name} (${campaign.status})`,
        value: campaign.id,
      })),
    };
  },
});

export const woodpeckerClient = {
  async makeRequest<T>(
    auth: string,
    method: HttpMethod,
    endpoint: string,
    body?: unknown,
    queryParams?: Record<string, string>
  ): Promise<T> {
    const request: HttpRequest = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'x-api-key': auth,
      },
      body,
      queryParams,
    };
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  },
};
