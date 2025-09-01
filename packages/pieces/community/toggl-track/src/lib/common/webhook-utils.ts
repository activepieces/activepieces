import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import crypto from 'crypto';

export interface TogglWebhookSubscription {
  subscription_id: number;
  workspace_id: number;
  user_id: number;
  enabled: boolean;
  description: string;
  event_filters: Array<{
    entity: string;
    action: string;
  }>;
  url_callback: string;
  secret: string;
  validated_at: string | null;
  has_pending_events: boolean;
  created_at: string;
}

export interface TogglWebhookEvent {
  event_id: number;
  created_at: string;
  creator_id: number;
  metadata: {
    request_type: string;
    event_user_id: number;
    model_id?: number;
    path?: string;
    [key: string]: unknown;
  };
  payload: unknown;
  subscription_id: number;
  url_callback: string;
  timestamp: string;
}

export class TogglWebhookManager {
  private apiToken: string;
  private baseUrl = 'https://api.track.toggl.com/webhooks/api/v1';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'User-Agent': 'Activepieces-TogglTrack/1.0',
      Authorization: `Basic ${Buffer.from(
        `${this.apiToken}:api_token`
      ).toString('base64')}`,
    };
  }

  async createSubscription(
    workspaceId: number,
    urlCallback: string,
    eventFilters: Array<{ entity: string; action: string }>,
    description: string,
    secret?: string,
    enabled: boolean = false
  ): Promise<TogglWebhookSubscription> {
    const payload: any = {
      url_callback: urlCallback,
      event_filters: eventFilters,
      enabled,
      description,
    };

    if (secret) {
      payload.secret = secret;
    }

    const response = await httpClient.sendRequest<TogglWebhookSubscription>({
      method: HttpMethod.POST,
      url: `${this.baseUrl}/subscriptions/${workspaceId}`,
      headers: this.getAuthHeaders(),
      body: payload,
    });

    return response.body;
  }

  async deleteSubscription(
    workspaceId: number,
    subscriptionId: number
  ): Promise<void> {
    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${this.baseUrl}/subscriptions/${workspaceId}/${subscriptionId}`,
      headers: this.getAuthHeaders(),
    });
  }

  async validateSubscription(
    workspaceId: number,
    subscriptionId: number
  ): Promise<void> {
    await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${this.baseUrl}/validate/${workspaceId}/${subscriptionId}`,
      headers: this.getAuthHeaders(),
    });
  }

  async enableSubscription(
    workspaceId: number,
    subscriptionId: number
  ): Promise<void> {
    await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `${this.baseUrl}/subscriptions/${workspaceId}/${subscriptionId}`,
      headers: this.getAuthHeaders(),
      body: {
        enabled: true,
      },
    });
  }

  async updateSubscriptionSecret(
    workspaceId: number,
    subscriptionId: number,
    secret: string
  ): Promise<void> {
    await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${this.baseUrl}/subscriptions/${workspaceId}/${subscriptionId}`,
      headers: this.getAuthHeaders(),
      body: {
        secret: secret,
      },
    });
  }

  async listSubscriptions(
    workspaceId: number
  ): Promise<TogglWebhookSubscription[]> {
    const response = await httpClient.sendRequest<TogglWebhookSubscription[]>({
      method: HttpMethod.GET,
      url: `${this.baseUrl}/subscriptions/${workspaceId}`,
      headers: this.getAuthHeaders(),
    });

    return response.body || [];
  }

  validateEventSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      // Remove 'sha256=' prefix if present
      const expectedSignature = signature.replace(/^sha256=/, '');

      // Calculate HMAC
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const calculatedSignature = hmac.digest('hex');

      // Compare signatures
      return calculatedSignature === expectedSignature;
    } catch (error) {
      return false;
    }
  }

  parseWebhookEvent(body: string): TogglWebhookEvent {
    return JSON.parse(body);
  }

  async pingSubscription(
    workspaceId: number,
    subscriptionId: number
  ): Promise<void> {
    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${this.baseUrl}/ping/${workspaceId}/${subscriptionId}`,
      headers: this.getAuthHeaders(),
    });
  }

  async getAvailableEventFilters(): Promise<
    Array<{ entity: string; actions: string[] }>
  > {
    const response = await httpClient.sendRequest<
      Array<{ entity: string; actions: string[] }>
    >({
      method: HttpMethod.GET,
      url: `${this.baseUrl}/event_filters`,
      headers: this.getAuthHeaders(),
    });

    return response.body || [];
  }
}

export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' ||
      (parsed.protocol === 'http:' && parsed.hostname === 'localhost')
    );
  } catch {
    return false;
  }
}

export function createEventFilters(
  entity: string,
  action = 'created'
): Array<{ entity: string; action: string }> {
  return [{ entity, action }];
}

// Helper function to generate a unique description for subscriptions
export function generateSubscriptionDescription(
  triggerName: string,
  workspaceId: number
): string {
  const timestamp = Date.now();
  return `Activepieces-${triggerName}-${workspaceId}-${timestamp}`;
}
