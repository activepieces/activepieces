import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addCrmContactTagAction } from './add-crm-contact-tag';
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

describe('addCrmContactTagAction', () => {
  it('calls POST /api/crm/contacts/:uuid/tags', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (addCrmContactTagAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID, tag: 'vip' },
    });
    expect(mockClient.mock.calls[0][2]).toBe(`/api/crm/contacts/${TEST_UUID}/tags`);
  });

  it('sends tag in body', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (addCrmContactTagAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID, tag: 'vip' },
    });
    expect(mockClient.mock.calls[0][3]).toEqual({ tag: 'vip' });
  });

  it('passes API key as first arg', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (addCrmContactTagAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID, tag: 'vip' },
    });
    expect(mockClient.mock.calls[0][0]).toBe('test-api-key');
  });

  it('returns updated contact', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    const result = await (addCrmContactTagAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID, tag: 'vip' },
    });
    expect(result).toEqual(MOCK_CRM_CONTACT);
  });

  it('surfaces thrown error', async () => {
    mockClient.mockRejectedValueOnce(new Error('404 Not Found'));
    await expect(
      (addCrmContactTagAction as any).run({
        auth: mockAuth,
        propsValue: { contactId: TEST_UUID, tag: 'vip' },
      })
    ).rejects.toThrow('404 Not Found');
  });
});
