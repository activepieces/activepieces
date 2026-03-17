import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DIMO_API_URLS } from '../common/constants';

export interface DimoWebhookConfig {
  service: string;
  metricName: string;
  condition: string;
  coolDownPeriod: number;
  targetURL: string;
  status: string;
  verificationToken: string;
  description?: string;
  displayName?: string;
}

export interface DimoWebhookResponse {
  id: string;
  service: string;
  metricName: string;
  condition: string;
  coolDownPeriod: number;
  targetURL: string;
  status: string;
}

export async function createDimoWebhook(
  developerJwt: string,
  config: DimoWebhookConfig
): Promise<DimoWebhookResponse> {
  const body: Record<string, unknown> = {
    service: config.service,
    metricName: config.metricName,
    condition: config.condition,
    coolDownPeriod: config.coolDownPeriod,
    targetURL: config.targetURL,
    status: config.status,
    verificationToken: config.verificationToken,
  };

  if (config.description) body['description'] = config.description;
  if (config.displayName) body['displayName'] = config.displayName;

  const response = await httpClient.sendRequest<DimoWebhookResponse>({
    method: HttpMethod.POST,
    url: `${DIMO_API_URLS.VEHICLE_TRIGGERS}/v1/webhooks`,
    headers: {
      Authorization: `Bearer ${developerJwt}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  return response.body;
}

export async function deleteDimoWebhook(
  developerJwt: string,
  webhookId: string
): Promise<void> {
  await httpClient.sendRequest({
    method: HttpMethod.DELETE,
    url: `${DIMO_API_URLS.VEHICLE_TRIGGERS}/v1/webhooks/${webhookId}`,
    headers: {
      Authorization: `Bearer ${developerJwt}`,
    },
  });
}

export async function subscribeAllVehicles(
  developerJwt: string,
  webhookId: string
): Promise<void> {
  await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `${DIMO_API_URLS.VEHICLE_TRIGGERS}/v1/webhooks/${webhookId}/subscribe/all`,
    headers: {
      Authorization: `Bearer ${developerJwt}`,
      'Content-Type': 'application/json',
    },
  });
}

export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export interface StoredWebhookInfo {
  webhookId: string;
  verificationToken: string;
}
