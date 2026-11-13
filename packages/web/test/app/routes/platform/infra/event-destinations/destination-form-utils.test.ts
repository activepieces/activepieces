import {
  ApplicationEventName,
  EventDestinationFormat,
  formErrors,
} from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { destinationFormUtils } from '@/app/routes/platform/infra/event-destinations/lib/destination-form-utils';

import { makeDestination } from './event-destination-fixtures';

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
  it('refuses a value with a hidden or control character that the delivery cannot send', () => {
    expect(
      destinationFormUtils.findHeaderIssues({
        headers: [
          { name: 'Authorization', value: 'Bearer token\u200b' },
          { name: 'X-Tenant', value: 'one\ntwo' },
          { name: 'X-Team', value: 'Équipe\tA' },
        ],
        storedHeaderNames: [],
        isUrlChanged: false,
      }),
    ).toEqual([
      { index: 0, field: 'value', message: formErrors.invalidHeaderValue },
      { index: 1, field: 'value', message: formErrors.invalidHeaderValue },
    ]);
  });

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
        destination: makeDestination({
          headers: { 'X-Team': null, Authorization: null },
        }),
        kind: 'webhook',
      }).headers,
    ).toEqual([
      { name: 'Authorization', value: '' },
      { name: 'X-Team', value: '' },
    ]);
  });

  it('lists the saved events in one fixed order, so the form starts clean', () => {
    expect(
      destinationFormUtils.toDefaultValues({
        destination: makeDestination({
          events: [
            ApplicationEventName.FLOW_DELETED,
            ApplicationEventName.FLOW_CREATED,
          ],
        }),
        kind: 'webhook',
      }).events,
    ).toEqual([
      ApplicationEventName.FLOW_CREATED,
      ApplicationEventName.FLOW_DELETED,
    ]);
  });

  it('gives the same event list back after an event is cleared and selected again', () => {
    const saved = destinationFormUtils.inCanonicalOrder([
      ApplicationEventName.FLOW_CREATED,
      ApplicationEventName.FLOW_DELETED,
      ApplicationEventName.USER_SIGNED_IN,
    ]);
    const cleared = saved.filter(
      (event) => event !== ApplicationEventName.FLOW_CREATED,
    );

    expect(
      destinationFormUtils.inCanonicalOrder([
        ...cleared,
        ApplicationEventName.FLOW_CREATED,
      ]),
    ).toEqual(saved);
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

describe('destinationFormUtils.toHandlerFlowId', () => {
  const webhookPrefixUrl = 'https://cloud.example.com/api/v1/webhooks';
  const flowId = 'abcdefghijklmnopqrstu';

  it('returns the flow id of a complete handler flow URL', () => {
    expect(
      destinationFormUtils.toHandlerFlowId({
        url: `${webhookPrefixUrl}/${flowId}`,
        webhookPrefixUrl,
      }),
    ).toBe(flowId);
  });

  it('returns the flow id when a route suffix and a query follow it', () => {
    expect(
      destinationFormUtils.toHandlerFlowId({
        url: `${webhookPrefixUrl}/${flowId}/sync?x=1`,
        webhookPrefixUrl,
      }),
    ).toBe(flowId);
  });

  it('ignores a flow id that is still being typed', () => {
    expect(
      destinationFormUtils.toHandlerFlowId({
        url: `${webhookPrefixUrl}/abc`,
        webhookPrefixUrl,
      }),
    ).toBeNull();
  });

  it('ignores a URL outside the webhook prefix, or a missing prefix', () => {
    expect(
      destinationFormUtils.toHandlerFlowId({
        url: `https://other.example.com/hooks/${flowId}`,
        webhookPrefixUrl,
      }),
    ).toBeNull();
    expect(
      destinationFormUtils.toHandlerFlowId({
        url: `${webhookPrefixUrl}/${flowId}`,
        webhookPrefixUrl: null,
      }),
    ).toBeNull();
  });
});

describe('destinationFormUtils.findTestHeaderBlocker', () => {
  it('asks for a retyped value while a saved header is blank', () => {
    expect(
      destinationFormUtils.findTestHeaderBlocker({
        headers: [{ name: 'Authorization', value: '' }],
        storedHeaderNames: ['authorization'],
      }),
    ).toBe('blankValue');
  });

  it('treats a blank value on a new header as a header error', () => {
    expect(
      destinationFormUtils.findTestHeaderBlocker({
        headers: [{ name: 'Authorization', value: '' }],
        storedHeaderNames: [],
      }),
    ).toBe('invalidHeader');
  });

  it('reports a header error before a saved value to retype', () => {
    expect(
      destinationFormUtils.findTestHeaderBlocker({
        headers: [
          { name: 'Authorization', value: '' },
          { name: 'Host', value: 'x' },
        ],
        storedHeaderNames: ['Authorization'],
      }),
    ).toBe('invalidHeader');
  });

  it('blocks a test for a reserved name, a duplicate, or a nameless value', () => {
    expect(
      destinationFormUtils.findTestHeaderBlocker({
        headers: [{ name: 'Host', value: 'x' }],
        storedHeaderNames: [],
      }),
    ).toBe('invalidHeader');
    expect(
      destinationFormUtils.findTestHeaderBlocker({
        headers: [
          { name: 'X-Team', value: 'a' },
          { name: 'x-team', value: 'b' },
        ],
        storedHeaderNames: [],
      }),
    ).toBe('invalidHeader');
    expect(
      destinationFormUtils.findTestHeaderBlocker({
        headers: [{ name: '', value: 'x' }],
        storedHeaderNames: [],
      }),
    ).toBe('invalidHeader');
  });

  it('lets a test through with valid headers and a blank row', () => {
    expect(
      destinationFormUtils.findTestHeaderBlocker({
        headers: [],
        storedHeaderNames: [],
      }),
    ).toBeNull();
    expect(
      destinationFormUtils.findTestHeaderBlocker({
        headers: [
          { name: 'Authorization', value: 'Bearer token' },
          { name: '', value: '' },
        ],
        storedHeaderNames: ['Authorization'],
      }),
    ).toBeNull();
  });
});

describe('destinationFormUtils.isSameTestRequest', () => {
  const sent = destinationFormUtils.toTestRequest({
    url: 'https://example.com/hook',
    event: ApplicationEventName.FLOW_CREATED,
    headers: [
      { name: 'A', value: '1' },
      { name: 'B', value: '2' },
    ],
    format: EventDestinationFormat.RAW,
  });

  it('matches the same inputs, in any header order, ignoring a blank row', () => {
    expect(
      destinationFormUtils.isSameTestRequest({
        sent,
        current: destinationFormUtils.toTestRequest({
          url: 'https://example.com/hook',
          event: ApplicationEventName.FLOW_CREATED,
          headers: [
            { name: 'B', value: '2' },
            { name: 'A', value: '1' },
            { name: '', value: '' },
          ],
          format: EventDestinationFormat.RAW,
        }),
      }),
    ).toBe(true);
  });

  it('stops matching once the URL, event, format or a header value changes', () => {
    const changed = [
      { ...sent, url: 'https://example.com/other' },
      { ...sent, event: ApplicationEventName.FLOW_DELETED },
      { ...sent, format: EventDestinationFormat.OTLP_JSON },
      { ...sent, headers: { A: '1', B: '3' } },
    ];

    changed.forEach((current) => {
      expect(destinationFormUtils.isSameTestRequest({ sent, current })).toBe(
        false,
      );
    });
  });
});

describe('destinationFormUtils.resolveOtlpFormat', () => {
  const webhookUrl = 'https://cloud.example.com/api/v1/webhooks/abc123';
  const otlpUrl = 'https://otlp.datadoghq.com/v1/logs';

  it('switches Protobuf to JSON for a flow webhook URL and remembers it did', () => {
    expect(
      destinationFormUtils.resolveOtlpFormat({
        url: webhookUrl,
        format: EventDestinationFormat.OTLP_PROTOBUF,
        isAutoSwitched: false,
      }),
    ).toEqual({
      format: EventDestinationFormat.OTLP_JSON,
      isAutoSwitched: true,
    });
  });

  it('switches back to Protobuf once the URL is no longer a flow webhook', () => {
    expect(
      destinationFormUtils.resolveOtlpFormat({
        url: otlpUrl,
        format: EventDestinationFormat.OTLP_JSON,
        isAutoSwitched: true,
      }),
    ).toEqual({
      format: EventDestinationFormat.OTLP_PROTOBUF,
      isAutoSwitched: false,
    });
  });

  it('keeps JSON that the admin chose', () => {
    expect(
      destinationFormUtils.resolveOtlpFormat({
        url: otlpUrl,
        format: EventDestinationFormat.OTLP_JSON,
        isAutoSwitched: false,
      }),
    ).toEqual({
      format: EventDestinationFormat.OTLP_JSON,
      isAutoSwitched: false,
    });
  });

  it('stays on JSON while the URL is still a flow webhook', () => {
    expect(
      destinationFormUtils.resolveOtlpFormat({
        url: webhookUrl,
        format: EventDestinationFormat.OTLP_JSON,
        isAutoSwitched: true,
      }),
    ).toEqual({
      format: EventDestinationFormat.OTLP_JSON,
      isAutoSwitched: true,
    });
  });
});
