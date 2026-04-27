import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendLocationToGroupAction } from './send-location-to-group';
import { whatsscaleClient } from '../../common/client';
import { buildRecipientBody, RecipientType } from '../../common/recipients';

vi.mock('../../common/client');
vi.mock('../../common/recipients');

describe('sendLocationToGroupAction', () => {
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

  it('sends location to group with title', async () => {
    await sendLocationToGroupAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        group: 'group123@g.us',
        latitude: 52.3676,
        longitude: 4.9041,
        title: 'Amsterdam',
      } as any,
    } as any);

    expect(mockClient).toHaveBeenCalledWith(
      'ws_key',
      expect.anything(),
      '/api/sendLocation',
      {
        session: 'user_test',
        chatId: 'group123@g.us',
        latitude: 52.3676,
        longitude: 4.9041,
        title: 'Amsterdam',
        platform: 'activepieces',
      },
    );
  });

  it('sends location to group without title — title key absent', async () => {
    await sendLocationToGroupAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        group: 'group123@g.us',
        latitude: 52.3676,
        longitude: 4.9041,
        title: undefined,
      } as any,
    } as any);

    const callBody = mockClient.mock.calls[0][3] as Record<string, unknown>;
    expect(callBody).not.toHaveProperty('title');
  });

  it('uses GROUP recipient type', async () => {
    await sendLocationToGroupAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        group: 'group123@g.us',
        latitude: 1.0,
        longitude: 1.0,
      } as any,
    } as any);

    expect(mockBuildBody).toHaveBeenCalledWith(
      RecipientType.GROUP,
      'user_test',
      'group123@g.us',
    );
  });

  it('calls correct endpoint', async () => {
    await sendLocationToGroupAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        group: 'group123@g.us',
        latitude: 1.0,
        longitude: 1.0,
      } as any,
    } as any);

    expect(mockClient).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      '/api/sendLocation',
      expect.anything(),
    );
  });

  it('returns response body', async () => {
    const result = await sendLocationToGroupAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        group: 'group123@g.us',
        latitude: 1.0,
        longitude: 1.0,
      } as any,
    } as any);

    expect(result).toEqual({ success: true });
  });
});
