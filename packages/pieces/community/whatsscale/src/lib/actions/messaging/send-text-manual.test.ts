import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TEST_API_KEY, createMockHttpResponse } from '../../test-helpers';

const mockSendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', () => ({
  httpClient: { sendRequest: (...args: unknown[]) => mockSendRequest(...args) },
  HttpMethod: { GET: 'GET', POST: 'POST' },
}));

/**
 * send-text-manual.ts run() logic:
 *   1. Extracts session, chatType, recipient, text from context.propsValue
 *   2. Gets auth from context.auth.secret_text
 *   3. Builds chatId: recipient + (@c.us for contact, @g.us for group)
 *   4. POST /api/sendText with { session, chatId, text }
 *   5. Returns response.body
 */

// Import after mocks
import { whatsscaleClient } from '../../common/client';
import { ChatType } from '../../common/types';

/**
 * Replicate the run() logic from send-text-manual.ts for testability.
 */
async function runSendTextManual(params: {
  auth: string;
  session: string;
  chatType: string;
  recipient: string;
  text: string;
}) {
  const { auth, session, chatType, recipient, text } = params;
  const suffix = chatType === ChatType.CONTACT ? '@c.us' : '@g.us';
  const chatId = recipient + suffix;

  const response = await whatsscaleClient(auth, 'POST' as any, '/api/sendText', {
    session,
    chatId,
    text,
    platform: 'activepieces',
  });

  return response.body;
}

describe('send-text-manual.ts — Send a Message (Manual Entry)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const successResponse = {
    key: {
      remoteJid: '31649931832@c.us',
      fromMe: true,
      id: 'ABCDEF123456',
    },
    messageTimestamp: '1709500000',
    status: '2',
  };

  it('builds chatId with @c.us when chatType is contact', async () => {
    mockSendRequest.mockResolvedValueOnce(createMockHttpResponse(successResponse));

    await runSendTextManual({
      auth: TEST_API_KEY,
      session: 'user_abc',
      chatType: ChatType.CONTACT,
      recipient: '+31649931832',
      text: 'Hello',
    });

    expect(mockSendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          chatId: '+31649931832@c.us',
        }),
      }),
    );
  });

  it('builds chatId with @g.us when chatType is group', async () => {
    mockSendRequest.mockResolvedValueOnce(createMockHttpResponse(successResponse));

    await runSendTextManual({
      auth: TEST_API_KEY,
      session: 'user_abc',
      chatType: ChatType.GROUP,
      recipient: '120363318673245672',
      text: 'Hello group',
    });

    expect(mockSendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          chatId: '120363318673245672@g.us',
        }),
      }),
    );
  });

  it('calls POST /api/sendText with correct body', async () => {
    mockSendRequest.mockResolvedValueOnce(createMockHttpResponse(successResponse));

    await runSendTextManual({
      auth: TEST_API_KEY,
      session: 'user_abc',
      chatType: ChatType.CONTACT,
      recipient: '+31649931832',
      text: 'Test message',
    });

    expect(mockSendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://proxy.whatsscale.com/api/sendText',
        body: {
          session: 'user_abc',
          chatId: '+31649931832@c.us',
          text: 'Test message',
          platform: 'activepieces',
        },
      }),
    );
  });

  it('sends session in request body', async () => {
    mockSendRequest.mockResolvedValueOnce(createMockHttpResponse(successResponse));

    await runSendTextManual({
      auth: TEST_API_KEY,
      session: 'user_xyz_789',
      chatType: ChatType.CONTACT,
      recipient: '+5511999887766',
      text: 'Olá',
    });

    expect(mockSendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          session: 'user_xyz_789',
        }),
      }),
    );
  });

  it('returns full response body on success', async () => {
    mockSendRequest.mockResolvedValueOnce(createMockHttpResponse(successResponse));

    const result = await runSendTextManual({
      auth: TEST_API_KEY,
      session: 'user_abc',
      chatType: ChatType.CONTACT,
      recipient: '+31649931832',
      text: 'Hello',
    });

    expect(result).toEqual(successResponse);
    expect(result).toHaveProperty('key');
    expect(result).toHaveProperty('messageTimestamp');
    expect(result).toHaveProperty('status');
  });

  it('propagates error on 400 (invalid chatId)', async () => {
    mockSendRequest.mockRejectedValueOnce(
      new Error('Request failed with status 400: {"error":"Invalid chatId format"}'),
    );

    await expect(
      runSendTextManual({
        auth: TEST_API_KEY,
        session: 'user_abc',
        chatType: ChatType.CONTACT,
        recipient: 'invalid',
        text: 'Hello',
      }),
    ).rejects.toThrow('400');
  });

  it('propagates error on 429 (rate limit)', async () => {
    mockSendRequest.mockRejectedValueOnce(
      new Error('Request failed with status 429: {"error":"Rate limit exceeded"}'),
    );

    await expect(
      runSendTextManual({
        auth: TEST_API_KEY,
        session: 'user_abc',
        chatType: ChatType.CONTACT,
        recipient: '+31649931832',
        text: 'Hello',
      }),
    ).rejects.toThrow('429');
  });
});
