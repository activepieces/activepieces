import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteCrmContactAction } from './delete-crm-contact';
import * as clientModule from '../../common/client';

vi.mock('../../common/client', () => ({
  whatsscaleClient: vi.fn(),
}));

const mockAuth = { secret_text: 'test-api-key' } as any;
const TEST_UUID = '550e8400-e29b-41d4-a716-446655440000';
const MOCK_DELETE = { success: true, deleted: true };
const mockClient = vi.mocked(clientModule.whatsscaleClient);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('deleteCrmContactAction', () => {
  it('calls DELETE /api/crm/contacts/:uuid', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_DELETE } as any);
    await (deleteCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID },
    });
    expect(mockClient.mock.calls[0][1]).toBe('DELETE');
    expect(mockClient.mock.calls[0][2]).toContain(TEST_UUID);
  });

  it('passes undefined as body', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_DELETE } as any);
    await (deleteCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID },
    });
    expect(mockClient.mock.calls[0][3]).toBeUndefined();
  });

  it('passes API key as first arg', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_DELETE } as any);
    await (deleteCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID },
    });
    expect(mockClient.mock.calls[0][0]).toBe('test-api-key');
  });

  it('returns { success, deleted } shape', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_DELETE } as any);
    const result = await (deleteCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { contactId: TEST_UUID },
    });
    expect(result).toEqual(MOCK_DELETE);
  });

  it('surfaces thrown error', async () => {
    mockClient.mockRejectedValueOnce(new Error('404 Not Found'));
    await expect(
      (deleteCrmContactAction as any).run({
        auth: mockAuth,
        propsValue: { contactId: TEST_UUID },
      })
    ).rejects.toThrow('404 Not Found');
  });
});
