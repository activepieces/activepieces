import {
  ApplicationEventName,
  EventDestinationFormat,
  EventDestinationScope,
} from '@activepieces/shared';
import type { EventDestination } from '@activepieces/shared';
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
        headers: [
          { name: 'Authorization', value: 'Bearer token' },
          { name: 'DD-API-KEY', value: 'key' },
        ],
        storedHeaderNames: [],
        isUrlChanged: false,
      }),
    ).toEqual([]);
  });

  it('ignores an empty row the admin added and left blank', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: [{ name: '', value: '' }],
        storedHeaderNames: [],
        isUrlChanged: false,
      }),
    ).toEqual([]);
  });

  it('refuses a header name the delivery sets itself, in any letter case', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: [{ name: 'content-type', value: 'text/plain' }],
        storedHeaderNames: [],
        isUrlChanged: false,
      }),
    ).toEqual([{ index: 0, field: 'name', message: 'reservedHeaderName' }]);
  });

  it('refuses a header name that is not a valid token', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: [{ name: 'X Api Key', value: 'key' }],
        storedHeaderNames: [],
        isUrlChanged: false,
      }),
    ).toEqual([{ index: 0, field: 'name', message: 'invalidHeaderName' }]);
  });

  it('flags both rows when two names differ only in letter case', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: [
          { name: 'X-Team', value: 'a' },
          { name: 'x-team', value: 'b' },
        ],
        storedHeaderNames: [],
        isUrlChanged: false,
      }),
    ).toEqual([
      { index: 0, field: 'name', message: 'duplicateHeaderName' },
      { index: 1, field: 'name', message: 'duplicateHeaderName' },
    ]);
  });

  it('flags both rows when the same name is typed twice', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: [
          { name: 'X-Team', value: 'a' },
          { name: 'X-Team', value: 'b' },
        ],
        storedHeaderNames: [],
        isUrlChanged: false,
      }),
    ).toEqual([
      { index: 0, field: 'name', message: 'duplicateHeaderName' },
      { index: 1, field: 'name', message: 'duplicateHeaderName' },
    ]);
  });

  it('flags a new value typed next to a blank copy of a saved header, so the old value is never kept by mistake', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: [
          { name: 'Authorization', value: 'new-secret' },
          { name: 'Authorization', value: '' },
        ],
        storedHeaderNames: ['Authorization'],
        isUrlChanged: false,
      }),
    ).toEqual([
      { index: 0, field: 'name', message: 'duplicateHeaderName' },
      { index: 1, field: 'name', message: 'duplicateHeaderName' },
    ]);
  });

  it('refuses a value that has no header name', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: [{ name: '', value: 'Bearer token' }],
        storedHeaderNames: [],
        isUrlChanged: false,
      }),
    ).toEqual([{ index: 0, field: 'name', message: 'Enter a header name' }]);
  });

  it('flags a nameless value even when a blank row follows it', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: [
          { name: '', value: 'secret' },
          { name: '', value: '' },
        ],
        storedHeaderNames: [],
        isUrlChanged: false,
      }),
    ).toEqual([{ index: 0, field: 'name', message: 'Enter a header name' }]);
  });

  it('refuses a new header with no value, which the server would drop', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: [{ name: 'Authorization', value: '' }],
        storedHeaderNames: [],
        isUrlChanged: false,
      }),
    ).toEqual([
      { index: 0, field: 'value', message: 'Enter a value for this header' },
    ]);
  });

  it('asks for a value when a saved header is renamed', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: [{ name: 'X-Auth', value: '' }],
        storedHeaderNames: ['Authorization'],
        isUrlChanged: false,
      }),
    ).toEqual([
      { index: 0, field: 'value', message: 'Enter a value for this header' },
    ]);
  });

  it('reports both a reserved name and a missing value on the same row', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: [{ name: 'Host', value: '' }],
        storedHeaderNames: [],
        isUrlChanged: false,
      }),
    ).toEqual([
      { index: 0, field: 'name', message: 'reservedHeaderName' },
      { index: 0, field: 'value', message: 'Enter a value for this header' },
    ]);
  });

  it('keeps a saved header value while the URL stays the same', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: [{ name: 'Authorization', value: '' }],
        storedHeaderNames: ['Authorization'],
        isUrlChanged: false,
      }),
    ).toEqual([]);
  });

  it('asks again only for the saved values that were not retyped when the URL changes', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: [
          { name: 'authorization', value: '' },
          { name: 'X-Team', value: 'ops' },
        ],
        storedHeaderNames: ['Authorization', 'X-Team'],
        isUrlChanged: true,
      }),
    ).toEqual([
      {
        index: 0,
        field: 'value',
        message: 'Re-enter this value to change the URL',
      },
    ]);
  });
});

describe('destinationFormUtils.buildFormSchema', () => {
  const validValues = {
    url: 'https://example.com/hook',
    events: [ApplicationEventName.FLOW_CREATED],
    headers: [],
    format: EventDestinationFormat.RAW,
  };

  it('says the URL is required when it is empty', () => {
    const result = destinationFormUtils
      .buildFormSchema({ storedHeaderNames: [], storedUrl: null })
      .safeParse({ ...validValues, url: '' });

    expect(result.error?.issues.map((issue) => issue.path)).toEqual([['url']]);
    expect(result.error?.issues[0].message).toBe('Endpoint URL is required');
  });

  it('says the URL is invalid when it is not a URL', () => {
    const result = destinationFormUtils
      .buildFormSchema({ storedHeaderNames: [], storedUrl: null })
      .safeParse({ ...validValues, url: 'not a url' });

    expect(result.error?.issues[0].message).toBe('Invalid URL');
  });

  it('puts each header issue on the row and field it belongs to', () => {
    const result = destinationFormUtils
      .buildFormSchema({ storedHeaderNames: [], storedUrl: null })
      .safeParse({
        ...validValues,
        headers: [
          { name: 'X-Team', value: 'a' },
          { name: 'x-team', value: 'b' },
        ],
      });

    expect(result.error?.issues.map((issue) => issue.path)).toEqual([
      ['headers', 0, 'name'],
      ['headers', 1, 'name'],
    ]);
  });

  it('asks for a saved value again only when the URL differs from the stored one', () => {
    const schema = destinationFormUtils.buildFormSchema({
      storedHeaderNames: ['Authorization'],
      storedUrl: 'https://example.com/hook',
    });
    const headers = [{ name: 'Authorization', value: '' }];

    expect(schema.safeParse({ ...validValues, headers }).success).toBe(true);
    expect(
      schema
        .safeParse({
          ...validValues,
          url: 'https://example.com/moved',
          headers,
        })
        .error?.issues.map((issue) => issue.path),
    ).toEqual([['headers', 0, 'value']]);
  });
});

describe('destinationFormUtils header conversion', () => {
  it('sends a blank value as null, which keeps the saved value, and skips a nameless row', () => {
    expect(
      destinationFormUtils.toHeaderRequest([
        { name: 'A', value: 't' },
        { name: 'B', value: '' },
        { name: '', value: '' },
      ]),
    ).toEqual({ A: 't', B: null });
  });

  it('tests only the headers that have both a name and a value', () => {
    expect(
      destinationFormUtils.toTestHeaders([
        { name: 'A', value: '1' },
        { name: 'B', value: '' },
        { name: '', value: 'x' },
      ]),
    ).toEqual({ A: '1' });
  });

  it('shows saved headers as sorted rows with blank values', () => {
    expect(
      destinationFormUtils.toDefaultValues({
        destination: makeDestination({ 'X-Team': null, Authorization: null }),
        kind: 'webhook',
      }).headers,
    ).toEqual([
      { name: 'Authorization', value: '' },
      { name: 'X-Team', value: '' },
    ]);
  });

  it('starts a new OpenTelemetry destination on Protobuf with no headers', () => {
    expect(
      destinationFormUtils.toDefaultValues({ destination: null, kind: 'otel' }),
    ).toEqual({
      url: '',
      events: [],
      headers: [],
      format: EventDestinationFormat.OTLP_PROTOBUF,
    });
  });
});

function makeDestination(headers: Record<string, null>): EventDestination {
  return {
    id: 'd1',
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
    platformId: 'platform1',
    scope: EventDestinationScope.PLATFORM,
    events: [ApplicationEventName.FLOW_CREATED],
    url: 'https://example.com/hook',
    enabled: true,
    headers,
    format: EventDestinationFormat.RAW,
  };
}
