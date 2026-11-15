import { afterEach, describe, expect, it, vi } from 'vitest';

import { httpError, memFiles, oauth, stubHttp } from '../common/test-support/http-stub';
import { downloadMessageAttachment } from './download-message-attachment';
import { getCallLog } from './get-call-log';
import { getMessage } from './get-message';
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

const MESSAGE_ID = '1234567890';
const MESSAGE_PATH = `/message-store/${MESSAGE_ID}`;
const CONTENT_PATH = `/message-store/${MESSAGE_ID}/content/`;

/**
 * An MMS as RingCentral actually reports it: type is 'SMS' (there is no MMS type), and the media
 * arrives as an extra MmsAttachment part alongside the Text part.
 */
const mmsWithPhoto = (overrides: Record<string, unknown> = {}) => ({
  id: Number(MESSAGE_ID),
  type: 'SMS',
  direction: 'Inbound',
  attachments: [
    { id: 111, type: 'Text', contentType: 'text/plain' },
    { id: 222, type: 'MmsAttachment', contentType: 'image/jpeg', fileName: 'pod.jpg' },
  ],
  ...overrides,
});

describe('get_message', () => {
  it('reads the message back by id', async () => {
    const stub = stubHttp();
    stub.route(MESSAGE_PATH, mmsWithPhoto());

    const result = await getMessage.run(ctx({ messageId: MESSAGE_ID }));

    expect(stub.find(MESSAGE_PATH)?.method).toBe('GET');
    expect(result).toMatchObject({ id: Number(MESSAGE_ID), type: 'SMS' });
  });

  it('escapes the id rather than interpolating it into the path raw', async () => {
    const stub = stubHttp();
    stub.route('/message-store/', { id: 'x' });

    await getMessage.run(ctx({ messageId: 'a/../b' }));

    expect(stub.find('/message-store/')?.url).toContain('a%2F..%2Fb');
  });
});

describe('download_message_attachment', () => {
  /**
   * The stub matches routes by substring, first registered wins, and the content URL contains the
   * message URL. So the content route has to be registered first or the metadata JSON would answer
   * the binary request too.
   */
  function stubMessage(message: Record<string, unknown>, content = Buffer.from('JPEGBYTES')) {
    const stub = stubHttp();
    stub.route(CONTENT_PATH, content);
    stub.route(MESSAGE_PATH, message);
    return stub;
  }

  function download(propsValue: Record<string, unknown>) {
    const files = memFiles();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const run = downloadMessageAttachment.run({ auth: oauth(), propsValue, files } as any);
    return { files, run };
  }

  it('picks the media part by default, skipping the SMS text part', async () => {
    const stub = stubMessage(mmsWithPhoto());

    const { files, run } = download({ messageId: MESSAGE_ID });
    const result = await run;

    // 222 is the photo; 111 is the text body, which is already on the trigger payload.
    expect(stub.find(CONTENT_PATH)?.url).toContain('/content/222');
    expect(files.written[0].fileName).toBe('pod.jpg');
    expect(result.file).toBe('mock://files/pod.jpg');
  });

  it('asks for the body as binary, so the bytes are not mangled into a string', async () => {
    const stub = stubMessage(mmsWithPhoto());

    await download({ messageId: MESSAGE_ID }).run;

    expect(stub.find(CONTENT_PATH)?.responseType).toBe('arraybuffer');
    // The metadata read stays JSON.
    expect(stub.find(MESSAGE_PATH)?.responseType).toBeUndefined();
  });

  it('honours an explicit attachment id', async () => {
    const stub = stubMessage(mmsWithPhoto());

    await download({ messageId: MESSAGE_ID, attachmentId: '111' }).run;

    expect(stub.find(CONTENT_PATH)?.url).toContain('/content/111');
  });

  it('lets the caller name the file, for a POD named after its load', async () => {
    stubMessage(mmsWithPhoto());

    const { files, run } = download({ messageId: MESSAGE_ID, fileName: 'L-4471-pod.jpg' });
    await run;

    // Overrides the reported pod.jpg, because the name matters to whatever stores it next.
    expect(files.written[0].fileName).toBe('L-4471-pod.jpg');
  });

  it('reads the other spelling of the reported name', async () => {
    stubMessage(
      mmsWithPhoto({
        attachments: [{ id: 222, type: 'MmsAttachment', filename: 'lowercase.png' }],
      }),
    );

    const { files, run } = download({ messageId: MESSAGE_ID });
    await run;

    expect(files.written[0].fileName).toBe('lowercase.png');
  });

  it('falls back to a generated name when RingCentral reports none', async () => {
    stubMessage(mmsWithPhoto({ attachments: [{ id: 222, type: 'MmsAttachment' }] }));

    const { files, run } = download({ messageId: MESSAGE_ID });
    await run;

    expect(files.written[0].fileName).toBe(`ringcentral-${MESSAGE_ID}-222`);
  });

  it('explains an SMS that carries nothing to download', async () => {
    stubMessage({ id: Number(MESSAGE_ID), type: 'SMS', attachments: [] });

    await expect(download({ messageId: MESSAGE_ID }).run).rejects.toThrow(
      /carries no attachments/,
    );
  });

  it('lists what is actually there when the given attachment id is wrong', async () => {
    stubMessage(mmsWithPhoto());

    await expect(
      download({ messageId: MESSAGE_ID, attachmentId: '999' }).run,
    ).rejects.toThrow(/has no attachment 999.*222/s);
  });

  it('never fetches content when the metadata read fails', async () => {
    const stub = stubHttp();
    stub.route(CONTENT_PATH, Buffer.from('never'));
    stub.route(MESSAGE_PATH, () => httpError(404, { message: 'Message not found' }));

    await expect(download({ messageId: MESSAGE_ID }).run).rejects.toThrow(/404/);
    expect(stub.find('/content/')).toBeUndefined();
  });
});
