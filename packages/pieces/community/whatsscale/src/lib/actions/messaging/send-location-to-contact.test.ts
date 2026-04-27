import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendLocationToContactAction } from './send-location-to-contact';
import { whatsscaleClient } from '../../common/client';
import { buildRecipientBody, RecipientType } from '../../common/recipients';

vi.mock('../../common/client');
vi.mock('../../common/recipients');

describe('sendLocationToContactAction', () => {
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

  it('sends location with title', async () => {
    await sendLocationToContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        contact: '31649931832@c.us',
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
        chatId: '31649931832@c.us',
        latitude: 52.3676,
        longitude: 4.9041,
        title: 'Amsterdam',
        platform: 'activepieces',
      },
    );
  });

  it('sends location without title — title key absent from body', async () => {
    await sendLocationToContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        contact: '31649931832@c.us',
        latitude: 52.3676,
        longitude: 4.9041,
        title: undefined,
      } as any,
    } as any);

    const callBody = mockClient.mock.calls[0][3] as Record<string, unknown>;
    expect(callBody).not.toHaveProperty('title');
    expect(callBody['latitude']).toBe(52.3676);
    expect(callBody['longitude']).toBe(4.9041);
  });

  it('sends location with empty string title — title key absent from body', async () => {
    await sendLocationToContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        contact: '31649931832@c.us',
        latitude: 48.8584,
        longitude: 2.2945,
        title: '',
      } as any,
    } as any);

    const callBody = mockClient.mock.calls[0][3] as Record<string, unknown>;
    expect(callBody).not.toHaveProperty('title');
  });

  it('calls correct endpoint', async () => {
    await sendLocationToContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        contact: '31649931832@c.us',
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
    const result = await sendLocationToContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        contact: '31649931832@c.us',
        latitude: 1.0,
        longitude: 1.0,
      } as any,
    } as any);

    expect(result).toEqual({ success: true });
  });
});
