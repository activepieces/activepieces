import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendLocationToCrmContactAction } from './send-location-to-crm-contact';
import { whatsscaleClient } from '../../common/client';
import { buildRecipientBody, RecipientType } from '../../common/recipients';

vi.mock('../../common/client');
vi.mock('../../common/recipients');

describe('sendLocationToCrmContactAction', () => {
  const mockClient = vi.mocked(whatsscaleClient);
  const mockBuildBody = vi.mocked(buildRecipientBody);

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.mockResolvedValue({ body: { success: true } } as any);
    mockBuildBody.mockReturnValue({
      session: 'user_test',
      contact_type: 'crm_contact',
      crm_contact_id: 'uuid-123',
    } as any);
  });

  it('sends location to CRM contact with title', async () => {
    await sendLocationToCrmContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        crmContact: 'uuid-123',
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
        contact_type: 'crm_contact',
        crm_contact_id: 'uuid-123',
        latitude: 52.3676,
        longitude: 4.9041,
        title: 'Amsterdam',
        platform: 'activepieces',
      },
    );
  });

  it('sends location to CRM contact without title — title key absent', async () => {
    await sendLocationToCrmContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        crmContact: 'uuid-123',
        latitude: 52.3676,
        longitude: 4.9041,
        title: undefined,
      } as any,
    } as any);

    const callBody = mockClient.mock.calls[0][3] as Record<string, unknown>;
    expect(callBody).not.toHaveProperty('title');
  });

  it('uses CRM_CONTACT recipient type', async () => {
    await sendLocationToCrmContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        crmContact: 'uuid-123',
        latitude: 1.0,
        longitude: 1.0,
      } as any,
    } as any);

    expect(mockBuildBody).toHaveBeenCalledWith(
      RecipientType.CRM_CONTACT,
      'user_test',
      'uuid-123',
    );
  });

  it('calls correct endpoint', async () => {
    await sendLocationToCrmContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        crmContact: 'uuid-123',
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
    const result = await sendLocationToCrmContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        crmContact: 'uuid-123',
        latitude: 1.0,
        longitude: 1.0,
      } as any,
    } as any);

    expect(result).toEqual({ success: true });
  });
});
