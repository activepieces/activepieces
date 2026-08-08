import { afterEach, describe, expect, it, vi } from 'vitest';

import { httpError, oauth, stubHttp } from '../common/test-support/http-stub';
import { getCallLog } from './get-call-log';
import { getExtensionInfo } from './get-extension-info';
import { makeCall } from './make-call';
import { sendSms } from './send-sms';
import { sendTeamMessage } from './send-team-message';

afterEach(() => vi.restoreAllMocks());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx = (propsValue: Record<string, unknown>): any => ({
  auth: oauth(),
  propsValue,
});

describe('send_sms', () => {
  it('wraps the numbers the way the SMS endpoint demands', async () => {
    const stub = stubHttp();
    stub.route('/sms', { id: 1 });

    await sendSms.run(
      ctx({ from: '+14155550100', to: ['+14155550123', 14155550124], text: 'hi' }),
    );

    const sent = stub.find('/sms');
    expect(sent?.method).toBe('POST');
    expect(sent?.body).toEqual({
      from: { phoneNumber: '+14155550100' },
      // Numbers typed into an Array prop can arrive as non-strings; the wire wants strings.
      to: [{ phoneNumber: '+14155550123' }, { phoneNumber: '14155550124' }],
      text: 'hi',
    });
  });

  it('surfaces the translated error when the number cannot send SMS', async () => {
    const stub = stubHttp();
    stub.route('/sms', () =>
      httpError(400, { errors: [{ errorCode: 'MSG-347', message: 'not SMS enabled' }] }),
    );

    await expect(
      sendSms.run(ctx({ from: '+1', to: ['+2'], text: 'hi' })),
    ).rejects.toThrow(/MSG-347/);
  });
});

describe('make_call', () => {
  it('omits callerId unless one was given', async () => {
    const stub = stubHttp();
    stub.route('/ring-out', { id: 1 });

    await makeCall.run(ctx({ from: '+1', to: '+2' }));

    expect(stub.find('/ring-out')?.body).toEqual({
      from: { phoneNumber: '+1' },
      to: { phoneNumber: '+2' },
      playPrompt: false,
    });
  });

  it('passes callerId and playPrompt through when set', async () => {
    const stub = stubHttp();
    stub.route('/ring-out', { id: 1 });

    await makeCall.run(ctx({ from: '+1', to: '+2', callerId: '+3', playPrompt: true }));

    expect(stub.find('/ring-out')?.body).toMatchObject({
      callerId: { phoneNumber: '+3' },
      playPrompt: true,
    });
  });
});

describe('send_team_message', () => {
  it('path-encodes the chat id', async () => {
    const stub = stubHttp();
    stub.route('/team-messaging', { id: 'p1' });

    await sendTeamMessage.run(ctx({ chatId: 'team/1', text: '**done**' }));

    const sent = stub.find('/team-messaging');
    expect(sent?.url).toMatch(/\/chats\/team%2F1\/posts$/);
    expect(sent?.body).toEqual({ text: '**done**' });
  });
});

describe('get_call_log', () => {
  it('sends only the filters that were set, with perPage stringified', async () => {
    const stub = stubHttp();
    stub.route('/call-log', { records: [] });

    await getCallLog.run(ctx({ direction: 'Inbound', perPage: 50 }));

    expect(stub.find('/call-log')?.queryParams).toEqual({
      direction: 'Inbound',
      perPage: '50',
    });
  });

  it('sends no query params when nothing was filtered', async () => {
    const stub = stubHttp();
    stub.route('/call-log', { records: [] });

    await getCallLog.run(ctx({}));

    expect(stub.find('/call-log')?.queryParams).toEqual({});
  });
});

describe('get_extension_info', () => {
  it('reads the authenticated extension', async () => {
    const stub = stubHttp();
    stub.route('/extension/~', { name: 'Dispatch' });

    const out = await getExtensionInfo.run(ctx({}));

    expect(out).toEqual({ name: 'Dispatch' });
    expect(stub.find('/extension/~')?.method).toBe('GET');
  });
});
