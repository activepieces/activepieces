/// <reference types="vitest/globals" />

import { vi } from 'vitest';
import { createMockActionContext } from '@activepieces/pieces-framework';

const { sendRequest } = vi.hoisted(() => ({ sendRequest: vi.fn() }));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

import '../../index';
import { telegramGetFileAction } from './get-file.action';
import { telegramGetFile } from './telegram-get-file';

const BOT_TOKEN = '123456:secret-bot-token';
const auth = { type: 'SECRET_TEXT', secret_text: BOT_TOKEN };
const fileInfo = { file_id: 'f1', file_unique_id: 'u1', file_size: 4, file_path: 'documents/file_7.pdf' };

function mockTelegram() {
  sendRequest.mockImplementation(async ({ url }: { url: string }) => {
    if (url.endsWith('/getFile')) {
      return { status: 200, body: { ok: true, result: fileInfo } };
    }
    return { status: 200, body: Buffer.from('data') };
  });
}

describe('telegram get_file output', () => {
  beforeEach(() => {
    sendRequest.mockReset();
    mockTelegram();
  });

  test('returns file details without the bot token', async () => {
    const output = await telegramGetFileAction.run({ ...createMockActionContext({ propsValue: { file_id: 'f1', download: false } }), auth });
    expect(output).toEqual({ file_info: fileInfo });
    expect(JSON.stringify(output)).not.toContain(BOT_TOKEN);
  });

  test('returns the downloaded content without the token and without writing a file', async () => {
    const write = vi.fn(async () => 'stored-file-url');
    const context = createMockActionContext({ propsValue: { file_id: 'f1', download: true } });
    const output = await telegramGetFileAction.run({ ...context, auth, files: { ...context.files, write } });
    expect(write).not.toHaveBeenCalled();
    expect(output).toEqual({ file_info: fileInfo, file_content_base64: Buffer.from('data').toString('base64') });
    expect(JSON.stringify(output)).not.toContain(BOT_TOKEN);
    expect(sendRequest.mock.calls[1][0].url).toContain(BOT_TOKEN);
  });

  test('the AI variant does not return the token either', async () => {
    const output = await telegramGetFile.run({ ...createMockActionContext({ propsValue: { file_id: 'f1', download: true } }), auth });
    expect(JSON.stringify(output)).not.toContain(BOT_TOKEN);
    expect(output).toMatchObject({ file_content_base64: Buffer.from('data').toString('base64') });
  });
});
