/// <reference types="vitest/globals" />

import { describe, it, expect, vi, afterEach } from 'vitest';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { httpSendRequestAction } from '../src/lib/actions/send-http-request-action';

const XML_BODY = '<?xml version="1.0" encoding="UTF-8"?><note><to>Tove</to></note>';

const buildContext = (propsOverrides: Record<string, unknown>) =>
  ({
    propsValue: {
      method: HttpMethod.POST,
      url: 'https://example.com',
      headers: { 'Content-Type': 'application/xml' },
      queryParams: {},
      authType: 'NONE',
      ...propsOverrides,
    },
  } as unknown as Parameters<typeof httpSendRequestAction.run>[0]);

describe('send_request body handling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a raw text body untouched (body_type raw)', async () => {
    const sendSpy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValue({ status: 200, headers: {}, body: 'ok' });

    const result = await httpSendRequestAction.run(
      buildContext({ body_type: 'raw', body: { data: XML_BODY } }),
    );

    const request = sendSpy.mock.calls[0][0];
    expect(request.body).toBe(XML_BODY);
    expect(request.headers?.['Content-Type']).toBe('application/xml');
    expect(result).toEqual({ status: 200, headers: {}, body: 'ok' });
  });

  it('sends non-JSON text untouched when body type is json (issue #13647)', async () => {
    const sendSpy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValue({ status: 200, headers: {}, body: 'ok' });

    await httpSendRequestAction.run(
      buildContext({ body_type: 'json', body: { data: XML_BODY } }),
    );

    expect(sendSpy.mock.calls[0][0].body).toBe(XML_BODY);
  });

  it('sends a parsed json object as the body (body_type json)', async () => {
    const sendSpy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValue({ status: 200, headers: {}, body: 'ok' });

    await httpSendRequestAction.run(
      buildContext({
        headers: { 'Content-Type': 'application/json' },
        body_type: 'json',
        body: { data: { key: 'value' } },
      }),
    );

    expect(sendSpy.mock.calls[0][0].body).toEqual({ key: 'value' });
  });
});
