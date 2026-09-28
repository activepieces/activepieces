import { describe, expect, it } from 'vitest';

import { destinationFormUtils } from '@/app/routes/platform/infra/event-destinations/lib/destination-form-utils';

describe('destinationFormUtils.isWebhookUrl', () => {
  it('matches a flow webhook URL on the instance host', () => {
    expect(
      destinationFormUtils.isWebhookUrl(
        'https://cloud.example.com/api/v1/webhooks/abc123',
      ),
    ).toBe(true);
  });

  it('matches a flow webhook URL on another host, such as an embed subdomain', () => {
    expect(
      destinationFormUtils.isWebhookUrl(
        'https://automations.customer.example/api/v1/webhooks/abc123/sync',
      ),
    ).toBe(true);
  });

  it('does not match an OTLP logs endpoint', () => {
    expect(
      destinationFormUtils.isWebhookUrl('https://otlp.datadoghq.com/v1/logs'),
    ).toBe(false);
  });

  it('does not match a webhook path without a flow id', () => {
    expect(
      destinationFormUtils.isWebhookUrl(
        'https://cloud.example.com/api/v1/webhooks/',
      ),
    ).toBe(false);
  });

  it('does not match a value that is not a URL', () => {
    expect(destinationFormUtils.isWebhookUrl('not a url')).toBe(false);
  });
});
