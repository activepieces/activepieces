import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCrmContactAction } from './get-crm-contact';
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

describe('getCrmContactAction', () => {
  it('calls GET /api/crm/contacts/:uuid', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (getCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID },
    });
    expect(mockClient.mock.calls[0][2]).toBe(`/api/crm/contacts/${TEST_UUID}`);
  });

  it('passes undefined as body', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (getCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID },
    });
    expect(mockClient.mock.calls[0][3]).toBeUndefined();
  });

  it('passes API key as first arg', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (getCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID },
    });
    expect(mockClient.mock.calls[0][0]).toBe('test-api-key');
  });

  it('returns response.body', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    const result = await (getCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID },
    });
    expect(result).toEqual(MOCK_CRM_CONTACT);
  });

  it('surfaces thrown error', async () => {
    mockClient.mockRejectedValueOnce(new Error('404 Not Found'));
    await expect(
      (getCrmContactAction as any).run({
        auth: mockAuth,
        propsValue: { contactId: TEST_UUID },
      })
    ).rejects.toThrow('404 Not Found');
  });
});
