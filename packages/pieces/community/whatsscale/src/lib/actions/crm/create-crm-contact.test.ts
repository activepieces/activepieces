import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCrmContactAction } from './create-crm-contact';
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

describe('createCrmContactAction', () => {
  it('posts to POST /api/crm/contacts', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (createCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { phone: '+31612345678' },
    });
    expect(mockClient).toHaveBeenCalledWith(
      expect.anything(),
      'POST',
      '/api/crm/contacts',
      expect.anything()
    );
  });

  it('sends phone in body', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (createCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { phone: '+31612345678' },
    });
    const body = mockClient.mock.calls[0][3] as Record<string, unknown>;
    expect(body).toMatchObject({ phone: '+31612345678' });
  });

  it('omits name when not provided', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (createCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { phone: '+31612345678', name: undefined },
    });
    const body = mockClient.mock.calls[0][3] as Record<string, unknown>;
    expect(body).not.toHaveProperty('name');
  });

  it('includes name when provided', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (createCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { phone: '+31612345678', name: 'Test Name' },
    });
    const body = mockClient.mock.calls[0][3] as Record<string, unknown>;
    expect(body.name).toBe('Test Name');
  });

  it('sends tags as raw string', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (createCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { phone: '+31612345678', tags: 'vip, customer' },
    });
    const body = mockClient.mock.calls[0][3] as Record<string, unknown>;
    expect(body.tags).toBe('vip, customer');
  });

  it('passes API key as first arg', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    await (createCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { phone: '+31612345678' },
    });
    expect(mockClient.mock.calls[0][0]).toBe('test-api-key');
  });

  it('returns response.body on success', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CRM_CONTACT } as any);
    const result = await (createCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { phone: '+31649931832', name: 'John Doe', tags: 'vip, customer' },
    });
    expect(result).toEqual(MOCK_CRM_CONTACT);
  });

  it('surfaces thrown error', async () => {
    mockClient.mockRejectedValueOnce(new Error('401 Unauthorized'));
    await expect(
      (createCrmContactAction as any).run({
        auth: mockAuth,
        propsValue: { phone: '+31612345678' },
      })
    ).rejects.toThrow('401 Unauthorized');
  });
});
