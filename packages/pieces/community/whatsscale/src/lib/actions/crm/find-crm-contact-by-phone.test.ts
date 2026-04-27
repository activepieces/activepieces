import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findCrmContactByPhoneAction } from './find-crm-contact-by-phone';
import * as clientModule from '../../common/client';

vi.mock('../../common/client', () => ({
  whatsscaleClient: vi.fn(),
}));

const mockAuth = { secret_text: 'test-api-key' } as any;
const TEST_UUID = '550e8400-e29b-41d4-a716-446655440000';
const MOCK_CRM_CONTACT = {
  id:         TEST_UUID,
  phone:      '+31649931832',
  name:       'John Doe',
  tags:       ['vip', 'customer'],
  source:     'api',
  created_at: '2026-03-05T00:00:00.000Z',
  updated_at: '2026-03-05T00:00:00.000Z',
};
const mockClient = vi.mocked(clientModule.whatsscaleClient);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('findCrmContactByPhoneAction', () => {
  it('calls GET /api/crm/contacts/phone/:phone with encoded phone', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (findCrmContactByPhoneAction as any).run({
      auth: mockAuth,
      propsValue: { phone: '+31612345678' },
    });
    expect(mockClient.mock.calls[0][2]).toBe('/api/crm/contacts/phone/%2B31612345678');
  });

  it('passes undefined as body', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (findCrmContactByPhoneAction as any).run({
      auth: mockAuth,
      propsValue: { phone: '+31612345678' },
    });
    expect(mockClient.mock.calls[0][3]).toBeUndefined();
  });

  it('passes API key as first arg', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (findCrmContactByPhoneAction as any).run({
      auth: mockAuth,
      propsValue: { phone: '+31612345678' },
    });
    expect(mockClient.mock.calls[0][0]).toBe('test-api-key');
  });

  it('returns response.body', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    const result = await (findCrmContactByPhoneAction as any).run({
      auth: mockAuth,
      propsValue: { phone: '+31612345678' },
    });
    expect(result).toEqual(MOCK_CRM_CONTACT);
  });

  it('surfaces thrown error', async () => {
    mockClient.mockRejectedValueOnce(new Error('404 Not Found'));
    await expect(
      (findCrmContactByPhoneAction as any).run({
        auth: mockAuth,
        propsValue: { phone: '+31612345678' },
      })
    ).rejects.toThrow('404 Not Found');
  });
});
