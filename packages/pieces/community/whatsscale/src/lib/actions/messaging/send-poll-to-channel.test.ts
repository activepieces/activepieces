import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendPollToChannelAction } from './send-poll-to-channel';
import { whatsscaleClient } from '../../common/client';
import { buildRecipientBody, RecipientType } from '../../common/recipients';

vi.mock('../../common/client');
vi.mock('../../common/recipients');

describe('sendPollToChannelAction', () => {
  const mockClient = vi.mocked(whatsscaleClient);
  const mockBuildBody = vi.mocked(buildRecipientBody);

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.mockResolvedValue({ body: { success: true } } as any);
    mockBuildBody.mockReturnValue({
      session: 'user_test',
      chatId: 'channel123@newsletter',
    } as any);
  });

  it('sends poll to channel with multipleAnswers true', async () => {
    await sendPollToChannelAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        channel: 'channel123@newsletter',
        question: 'Best feature?',
        options: ['Channels', 'Groups', 'DMs'],
        multipleAnswers: true,
      } as any,
    } as any);

    expect(mockClient).toHaveBeenCalledWith(
      'ws_key',
      expect.anything(),
      '/api/sendPoll',
      {
        session: 'user_test',
        chatId: 'channel123@newsletter',
        question: 'Best feature?',
        options: ['Channels', 'Groups', 'DMs'],
        multipleAnswers: true,
        platform: 'activepieces',
      },
    );
  });

  it('throws if fewer than 2 options provided', async () => {
    await expect(
      sendPollToChannelAction.run({
        auth: { secret_text: 'ws_key' } as any,
        propsValue: {
          session: 'user_test',
          channel: 'channel123@newsletter',
          question: 'Pick one',
          options: ['OnlyOne'],
        } as any,
      } as any),
    ).rejects.toThrow('Poll requires at least 2 options');
  });

  it('uses CHANNEL recipient type', async () => {
    await sendPollToChannelAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        channel: 'channel123@newsletter',
        question: 'Pick one',
        options: ['Yes', 'No'],
      } as any,
    } as any);

    expect(mockBuildBody).toHaveBeenCalledWith(
      RecipientType.CHANNEL,
      'user_test',
      'channel123@newsletter',
    );
  });

  it('calls correct endpoint', async () => {
    await sendPollToChannelAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        channel: 'channel123@newsletter',
        question: 'Pick one',
        options: ['Yes', 'No'],
      } as any,
    } as any);

    expect(mockClient).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      '/api/sendPoll',
      expect.anything(),
    );
  });

  it('returns response body', async () => {
    const result = await sendPollToChannelAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        channel: 'channel123@newsletter',
        question: 'Pick one',
        options: ['Yes', 'No'],
      } as any,
    } as any);

    expect(result).toEqual({ success: true });
  });
});
