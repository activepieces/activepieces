import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateCrmContactAction } from './update-crm-contact';
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

describe('updateCrmContactAction', () => {
  it('sends name only — no tags key in body', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (updateCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID, name: 'New', tags: undefined },
    });
    const body = mockClient.mock.calls[0][3] as Record<string, unknown>;
    expect(body).toEqual({ name: 'New' });
    expect(body).not.toHaveProperty('tags');
  });

  it('sends tags only — no name key in body', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (updateCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID, name: undefined, tags: 'vip' },
    });
    const body = mockClient.mock.calls[0][3] as Record<string, unknown>;
    expect(body).toEqual({ tags: 'vip' });
    expect(body).not.toHaveProperty('name');
  });

  it('sends both when both provided', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (updateCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID, name: 'X', tags: 'vip' },
    });
    const body = mockClient.mock.calls[0][3] as Record<string, unknown>;
    expect(body).toEqual({ name: 'X', tags: 'vip' });
  });

  it('sends empty string name (clears field)', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (updateCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID, name: '', tags: undefined },
    });
    const body = mockClient.mock.calls[0][3] as Record<string, unknown>;
    expect(body.name).toBe('');
  });

  it('does NOT send name when undefined', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (updateCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID, name: undefined, tags: undefined },
    });
    const body = mockClient.mock.calls[0][3] as Record<string, unknown>;
    expect(body).not.toHaveProperty('name');
  });

  it('calls PATCH /api/crm/contacts/:uuid', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (updateCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID, name: 'X', tags: undefined },
    });
    expect(mockClient.mock.calls[0][1]).toBe('PATCH');
    expect(mockClient.mock.calls[0][2]).toContain(TEST_UUID);
  });

  it('surfaces thrown error (e.g. 400)', async () => {
    mockClient.mockRejectedValueOnce(new Error('400 No fields to update'));
    await expect(
      (updateCrmContactAction as any).run({
        auth: mockAuth,
        propsValue: { contactId: TEST_UUID, name: undefined, tags: undefined },
      })
    ).rejects.toThrow('400 No fields to update');
  });
});
