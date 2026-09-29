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

describe('destinationFormUtils.findHeaderIssues', () => {
  it('accepts headers that each have a valid name and a value', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: { Authorization: 'Bearer token', 'DD-API-KEY': 'key' },
        storedHeaderNames: [],
        isUrlChanged: false,
      }),
    ).toEqual([]);
  });

  it('ignores an empty row the admin added and left blank', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: { '': '' },
        storedHeaderNames: [],
        isUrlChanged: false,
      }),
    ).toEqual([]);
  });

  it('refuses a header name the delivery sets itself, in any letter case', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: { 'content-type': 'text/plain' },
        storedHeaderNames: [],
        isUrlChanged: false,
      }),
    ).toEqual(['reservedHeaderName']);
  });

  it('refuses a header name that is not a valid token', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: { 'X Api Key': 'key' },
        storedHeaderNames: [],
        isUrlChanged: false,
      }),
    ).toEqual(['invalidHeaderName']);
  });

  it('refuses two names that differ only in letter case', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: { 'X-Team': 'a', 'x-team': 'b' },
        storedHeaderNames: [],
        isUrlChanged: false,
      }),
    ).toEqual(['duplicateHeaderName']);
  });

  it('refuses a value that has no header name', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: { '': 'Bearer token' },
        storedHeaderNames: [],
        isUrlChanged: false,
      }),
    ).toEqual(['Enter a name for every header']);
  });

  it('refuses a new header with no value, which the server would drop', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: { Authorization: '' },
        storedHeaderNames: [],
        isUrlChanged: false,
      }),
    ).toEqual(['Enter a value for every header you add']);
  });

  it('keeps a saved header value while the URL stays the same', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: { Authorization: '' },
        storedHeaderNames: ['Authorization'],
        isUrlChanged: false,
      }),
    ).toEqual([]);
  });

  it('asks for every saved header value again when the URL changes', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: { authorization: '', 'X-Team': 'ops' },
        storedHeaderNames: ['Authorization', 'X-Team'],
        isUrlChanged: true,
      }),
    ).toEqual(['Re-enter every header value to change the URL']);
  });
});
