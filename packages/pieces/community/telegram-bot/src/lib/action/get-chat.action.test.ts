/// <reference types="vitest/globals" />

import { vi } from 'vitest';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';

const { sendRequest } = vi.hoisted(() => ({ sendRequest: vi.fn() }));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

import '../../index';
import { telegramGetChatAction } from './get-chat.action';
import { telegramGetChatMemberAction } from './get-chat-member';

const auth = { type: 'SECRET_TEXT', secret_text: 'bot-token' };
const notFound = { ok: false, error_code: 400, description: 'Bad Request: chat not found' };

describe('telegram chat lookups', () => {
  beforeEach(() => {
    sendRequest.mockReset();
  });

  test('Get Chat returns the chat on success', async () => {
    sendRequest.mockResolvedValue({ status: 200, body: { ok: true, result: { id: 1 } } });
    const output = await telegramGetChatAction.run({ ...createMockActionContext({ propsValue: { chat_id: '1' } }), auth });
    expect(output).toEqual({ ok: true, result: { id: 1 } });
  });

  test('Get Chat fails the step when Telegram returns an error', async () => {
    sendRequest.mockRejectedValue(new HttpError({ chat_id: 'x' }, { status: 400, responseBody: notFound }));
    await expect(telegramGetChatAction.run({ ...createMockActionContext({ propsValue: { chat_id: 'x' } }), auth })).rejects.toThrow('chat not found');
  });

  test('Get Chat Member fails the step when Telegram returns an error', async () => {
    sendRequest.mockRejectedValue(new HttpError({ chat_id: 'x', user_id: '2' }, { status: 400, responseBody: notFound }));
    await expect(
      telegramGetChatMemberAction.run({ ...createMockActionContext({ propsValue: { chat_id: 'x', user_id: '2' } }), auth }),
    ).rejects.toThrow('chat not found');
  });
});
