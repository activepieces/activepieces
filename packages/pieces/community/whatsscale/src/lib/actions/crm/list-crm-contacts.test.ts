import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listCrmContactsAction } from './list-crm-contacts';
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
const MOCK_LIST = { items: [MOCK_CRM_CONTACT], total: 1, page: 1, limit: 50, hasMore: false };
const mockClient = vi.mocked(clientModule.whatsscaleClient);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listCrmContactsAction', () => {
  it('calls GET /api/crm/contacts', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_LIST } as any);
    await (listCrmContactsAction as any).run({
      auth: mockAuth,
      propsValue: {},
    });
    expect(mockClient.mock.calls[0][1]).toBe('GET');
    expect(mockClient.mock.calls[0][2]).toBe('/api/crm/contacts');
  });

  it('no props → 5th arg is undefined', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_LIST } as any);
    await (listCrmContactsAction as any).run({
      auth: mockAuth,
      propsValue: { tag: undefined, limit: null, page: null },
    });
    expect(mockClient.mock.calls[0][4]).toBeUndefined();
  });

  it('tag filter → queryParams.tag set', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_LIST } as any);
    await (listCrmContactsAction as any).run({
      auth: mockAuth,
      propsValue: { tag: 'vip' },
    });
    expect(mockClient.mock.calls[0][4]).toEqual({ tag: 'vip' });
  });

  it('limit converted to string', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_LIST } as any);
    await (listCrmContactsAction as any).run({
      auth: mockAuth,
      propsValue: { limit: 10 },
    });
    expect(mockClient.mock.calls[0][4]).toEqual({ limit: '10' });
  });

  it('page converted to string', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_LIST } as any);
    await (listCrmContactsAction as any).run({
      auth: mockAuth,
      propsValue: { page: 2 },
    });
    expect(mockClient.mock.calls[0][4]).toEqual({ page: '2' });
  });

  it('all params combined correctly', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_LIST } as any);
    await (listCrmContactsAction as any).run({
      auth: mockAuth,
      propsValue: { tag: 'vip', limit: 10, page: 2 },
    });
    expect(mockClient.mock.calls[0][4]).toEqual({ tag: 'vip', limit: '10', page: '2' });
  });

  it('returns list response shape', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_LIST } as any);
    const result = await (listCrmContactsAction as any).run({
      auth: mockAuth,
      propsValue: {},
    });
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.hasMore).toBe('boolean');
  });

  it('surfaces thrown error', async () => {
    mockClient.mockRejectedValueOnce(new Error('429 Too Many Requests'));
    await expect(
      (listCrmContactsAction as any).run({
        auth: mockAuth,
        propsValue: {},
      })
    ).rejects.toThrow('429 Too Many Requests');
  });
});
