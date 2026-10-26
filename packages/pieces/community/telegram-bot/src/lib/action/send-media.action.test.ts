/// <reference types="vitest/globals" />

import { vi } from 'vitest';
import FormData from 'form-data';
import { ApFile, createMockActionContext } from '@activepieces/pieces-framework';

const { sendRequest } = vi.hoisted(() => ({ sendRequest: vi.fn() }));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

import '../../index';
import { telegramSendMediaAction } from './send-media.action';

const auth = { type: 'SECRET_TEXT', secret_text: 'bot-token' };

function run(propsValue: Record<string, unknown>) {
  return telegramSendMediaAction.run({ ...createMockActionContext({ propsValue }), auth });
}

function sentRequest() {
  return sendRequest.mock.calls[0][0];
}

function sentFormFields(): string {
  const body = sentRequest().body;
  if (!(body instanceof FormData)) {
    throw new Error('expected a multipart body');
  }
  return body.getBuffer().toString('utf8');
}

function formHasField({ fields, name, value }: { fields: string; name: string; value: string }) {
  return fields.includes(`name="${name}"\r\n\r\n${value}\r\n`);
}

describe('telegram send_media payload', () => {
  beforeEach(() => {
    sendRequest.mockReset();
    sendRequest.mockResolvedValue({ status: 200, body: { ok: true } });
  });

  test('sends the emoji with an uploaded sticker', async () => {
    await run({
      chat_id: '123',
      media_type: 'sticker',
      media: { sticker: new ApFile('s.webp', Buffer.from('sticker')), emoji: '😀' },
    });
    expect(sentRequest().url).toContain('/sendSticker');
    expect(formHasField({ fields: sentFormFields(), name: 'emoji', value: '😀' })).toBe(true);
  });

  test('sends the duration with an uploaded GIF', async () => {
    await run({
      chat_id: '123',
      media_type: 'animation',
      media: { animation: new ApFile('a.mp4', Buffer.from('gif')), duration: 7 },
    });
    expect(sentRequest().url).toContain('/sendAnimation');
    expect(formHasField({ fields: sentFormFields(), name: 'duration', value: '7' })).toBe(true);
  });

  test('sends the duration with a GIF file ID', async () => {
    await run({ chat_id: '123', media_type: 'animation', media: { animationId: 'gif-id', duration: 7 } });
    expect(sentRequest().body).toMatchObject({ animation: 'gif-id', duration: 7 });
  });

  test('leaves duration out for other media types', async () => {
    await run({ chat_id: '123', media_type: 'photo', media: { photoId: 'photo-id', duration: 7 } });
    expect(sentRequest().body.duration).toBeUndefined();
  });

  test('does not send an empty emoji', async () => {
    await run({
      chat_id: '123',
      media_type: 'sticker',
      media: { sticker: new ApFile('s.webp', Buffer.from('sticker')), emoji: '' },
    });
    expect(sentFormFields()).not.toContain('name="emoji"');
  });
});
