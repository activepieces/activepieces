import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendPollToGroupAction } from './send-poll-to-group';
import { whatsscaleClient } from '../../common/client';
import { buildRecipientBody, RecipientType } from '../../common/recipients';

vi.mock('../../common/client');
vi.mock('../../common/recipients');

describe('sendPollToGroupAction', () => {
  const mockClient = vi.mocked(whatsscaleClient);
  const mockBuildBody = vi.mocked(buildRecipientBody);

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.mockResolvedValue({ body: { success: true } } as any);
    mockBuildBody.mockReturnValue({
      session: 'user_test',
      chatId: 'group123@g.us',
    } as any);
  });

  it('sends poll to group with options', async () => {
    await sendPollToGroupAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        group: 'group123@g.us',
        question: 'Team lunch?',
        options: ['Pizza', 'Sushi'],
        multipleAnswers: false,
      } as any,
    } as any);

    expect(mockClient).toHaveBeenCalledWith(
      'ws_key',
      expect.anything(),
      '/api/sendPoll',
      {
        session: 'user_test',
        chatId: 'group123@g.us',
        question: 'Team lunch?',
        options: ['Pizza', 'Sushi'],
        multipleAnswers: false,
        platform: 'activepieces',
      },
    );
  });

  it('throws if fewer than 2 options provided', async () => {
    await expect(
      sendPollToGroupAction.run({
        auth: { secret_text: 'ws_key' } as any,
        propsValue: {
          session: 'user_test',
          group: 'group123@g.us',
          question: 'Pick one',
          options: ['OnlyOne'],
        } as any,
      } as any),
    ).rejects.toThrow('Poll requires at least 2 options');
  });

  it('uses GROUP recipient type', async () => {
    await sendPollToGroupAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        group: 'group123@g.us',
        question: 'Pick one',
        options: ['Yes', 'No'],
      } as any,
    } as any);

    expect(mockBuildBody).toHaveBeenCalledWith(
      RecipientType.GROUP,
      'user_test',
      'group123@g.us',
    );
  });

  it('calls correct endpoint', async () => {
    await sendPollToGroupAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        group: 'group123@g.us',
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
    const result = await sendPollToGroupAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        group: 'group123@g.us',
        question: 'Pick one',
        options: ['Yes', 'No'],
      } as any,
    } as any);

    expect(result).toEqual({ success: true });
  });
});
