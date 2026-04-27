import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendPollToContactAction } from './send-poll-to-contact';
import { whatsscaleClient } from '../../common/client';
import { buildRecipientBody, RecipientType } from '../../common/recipients';

vi.mock('../../common/client');
vi.mock('../../common/recipients');

describe('sendPollToContactAction', () => {
  const mockClient = vi.mocked(whatsscaleClient);
  const mockBuildBody = vi.mocked(buildRecipientBody);

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.mockResolvedValue({ body: { success: true } } as any);
    mockBuildBody.mockReturnValue({
      session: 'user_test',
      chatId: '31649931832@c.us',
    } as any);
  });

  it('sends poll with 2 options as flat string array', async () => {
    await sendPollToContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        contact: '31649931832@c.us',
        question: 'Favourite color?',
        options: ['Red', 'Blue'],
        multipleAnswers: false,
      } as any,
    } as any);

    expect(mockClient).toHaveBeenCalledWith(
      'ws_key',
      expect.anything(),
      '/api/sendPoll',
      {
        session: 'user_test',
        chatId: '31649931832@c.us',
        question: 'Favourite color?',
        options: ['Red', 'Blue'],
        multipleAnswers: false,
        platform: 'activepieces',
      },
    );
  });

  it('sends poll with 3 options — all present in body', async () => {
    await sendPollToContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        contact: '31649931832@c.us',
        question: 'Pick one',
        options: ['Red', 'Blue', 'Green'],
        multipleAnswers: false,
      } as any,
    } as any);

    const callBody = mockClient.mock.calls[0][3] as Record<string, unknown>;
    expect(callBody['options']).toEqual(['Red', 'Blue', 'Green']);
  });

  it('throws if fewer than 2 options provided', async () => {
    await expect(
      sendPollToContactAction.run({
        auth: { secret_text: 'ws_key' } as any,
        propsValue: {
          session: 'user_test',
          contact: '31649931832@c.us',
          question: 'Pick one',
          options: ['OnlyOne'],
          multipleAnswers: false,
        } as any,
      } as any),
    ).rejects.toThrow('Poll requires at least 2 options');
  });

  it('multipleAnswers defaults to false when undefined', async () => {
    await sendPollToContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        contact: '31649931832@c.us',
        question: 'Pick one',
        options: ['Yes', 'No'],
        multipleAnswers: undefined,
      } as any,
    } as any);

    const callBody = mockClient.mock.calls[0][3] as Record<string, unknown>;
    expect(callBody['multipleAnswers']).toBe(false);
  });

  it('multipleAnswers: true passes through', async () => {
    await sendPollToContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        contact: '31649931832@c.us',
        question: 'Pick one',
        options: ['Yes', 'No'],
        multipleAnswers: true,
      } as any,
    } as any);

    const callBody = mockClient.mock.calls[0][3] as Record<string, unknown>;
    expect(callBody['multipleAnswers']).toBe(true);
  });

  it('calls correct endpoint', async () => {
    await sendPollToContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        contact: '31649931832@c.us',
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
    const result = await sendPollToContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        contact: '31649931832@c.us',
        question: 'Pick one',
        options: ['Yes', 'No'],
      } as any,
    } as any);

    expect(result).toEqual({ success: true });
  });
});
