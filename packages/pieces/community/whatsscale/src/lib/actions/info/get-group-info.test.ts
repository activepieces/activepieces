import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGroupInfoAction } from './get-group-info';
import { whatsscaleClient } from '../../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

vi.mock('../../common/client', () => ({
  whatsscaleClient: vi.fn(),
}));

const mockClient = vi.mocked(whatsscaleClient);

const MOCK_AUTH = { secret_text: 'ws_test_key' } as any;
const MOCK_AUTH_STRING = 'ws_test_key';

const MOCK_GROUP_BODY = {
  group_id: '123',
  name: 'Test Group',
  description: '',
  participant_count: 5,
  created_at: '2024-01-15T10:30:00.000Z',
  invite_link: '',
};

function makeContext(propsValue: Record<string, unknown>) {
  return {
    auth: MOCK_AUTH,
    propsValue,
  } as any;
}

describe('getGroupInfoAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns group info on success', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_GROUP_BODY, status: 200 } as any);

    const result = await getGroupInfoAction.run(makeContext({
      session: 'user_abc123',
      group_id: '123',
    }));

    expect(result).toEqual(MOCK_GROUP_BODY);
    expect(result.name).toBe('Test Group');
    expect(result.participant_count).toBe(5);
  });

  it('calls correct endpoint with session as queryParam (not encoded)', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_GROUP_BODY, status: 200 } as any);

    await getGroupInfoAction.run(makeContext({
      session: 'user_abc123',
      group_id: '123456789',
    }));

    expect(mockClient).toHaveBeenCalledWith(
      MOCK_AUTH_STRING,
      HttpMethod.GET,
      '/make/groups/123456789/info',
      undefined,
      { session: 'user_abc123' }
    );
  });

  it('trims whitespace from group_id', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_GROUP_BODY, status: 200 } as any);

    await getGroupInfoAction.run(makeContext({
      session: 'user_abc123',
      group_id: '  123456789  ',
    }));

    const callArgs = mockClient.mock.calls[0];
    const urlArg = callArgs[2] as string;
    expect(urlArg).toContain('123456789');
    expect(urlArg).not.toContain(' ');
  });

  it('encodes special chars in group_id (e.g. @g.us)', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_GROUP_BODY, status: 200 } as any);

    await getGroupInfoAction.run(makeContext({
      session: 'user_abc123',
      group_id: '120363123@g.us',
    }));

    const callArgs = mockClient.mock.calls[0];
    const urlArg = callArgs[2] as string;
    expect(urlArg).toContain(encodeURIComponent('120363123@g.us'));
  });

  it('throws on proxy error', async () => {
    mockClient.mockRejectedValueOnce(new Error('Group not found'));

    await expect(
      getGroupInfoAction.run(makeContext({
        session: 'user_abc123',
        group_id: '999999',
      }))
    ).rejects.toThrow('Group not found');
  });
});
