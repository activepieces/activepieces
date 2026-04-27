import { describe, it, expect, vi, beforeEach } from 'vitest';
import { removeCrmContactTagAction } from './remove-crm-contact-tag';
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
  tags:       ['vip'],
  source:     'api',
  created_at: '2026-03-05T00:00:00.000Z',
  updated_at: '2026-03-05T00:00:00.000Z',
};
const mockClient = vi.mocked(clientModule.whatsscaleClient);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('removeCrmContactTagAction', () => {
  it('encodes tag with spaces in URL', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (removeCrmContactTagAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID, tag: 'new customer' },
    });
    expect(mockClient.mock.calls[0][2]).toContain('new%20customer');
  });

  it('simple tag needs no special encoding', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (removeCrmContactTagAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID, tag: 'vip' },
    });
    expect(mockClient.mock.calls[0][2]).toMatch(/\/tags\/vip$/);
  });

  it('calls DELETE method', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (removeCrmContactTagAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID, tag: 'vip' },
    });
    expect(mockClient.mock.calls[0][1]).toBe('DELETE');
  });

  it('passes undefined as body', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (removeCrmContactTagAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID, tag: 'vip' },
    });
    expect(mockClient.mock.calls[0][3]).toBeUndefined();
  });

  it('returns updated contact', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    const result = await (removeCrmContactTagAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID, tag: 'vip' },
    });
    expect(result).toEqual(MOCK_CRM_CONTACT);
  });

  it('surfaces thrown error', async () => {
    mockClient.mockRejectedValueOnce(new Error('404 Not Found'));
    await expect(
      (removeCrmContactTagAction as any).run({
        auth: mockAuth,
        propsValue: { contactId: TEST_UUID, tag: 'vip' },
      })
    ).rejects.toThrow('404 Not Found');
  });
});
