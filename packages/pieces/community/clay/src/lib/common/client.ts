import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const CLAY_WEBHOOK_PATTERN =
  /^https:\/\/api\.clay\.com\/v3\/sources\/webhook\/pull-in-data-from-a-webhook-[a-f0-9-]+$/i;

function validateWebhookUrl(webhookUrl: string): void {
  if (!CLAY_WEBHOOK_PATTERN.test(webhookUrl)) {
    throw new Error(
      'Invalid Clay webhook URL. Expected format: https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-{UUID}'
    );
  }
}

function validateFieldName(fieldName: string): void {
  if (typeof fieldName !== 'string' || fieldName.trim().length === 0 || fieldName.length > 100) {
    throw new Error(`Invalid field name: "${fieldName}"`);
  }
}

function sanitizeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

export function sanitizeRecordData(recordData: Record<string, unknown>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [fieldName, fieldValue] of Object.entries(recordData)) {
    validateFieldName(fieldName);
    sanitized[fieldName] = sanitizeValue(fieldValue);
  }

  if (Object.keys(sanitized).length === 0) {
    throw new Error('Record data must contain at least one field.');
  }

  return sanitized;
}

export async function sendRecordToWebhook(params: {
  webhookUrl: string;
  recordData: Record<string, unknown>;
}): Promise<unknown> {
  const { webhookUrl, recordData } = params;

  validateWebhookUrl(webhookUrl);
  const sanitizedData = sanitizeRecordData(recordData);

  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: webhookUrl,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: sanitizedData,
  });

  return response.body ?? {
    success: true,
    data: sanitizedData,
    timestamp: new Date().toISOString(),
  };
}
