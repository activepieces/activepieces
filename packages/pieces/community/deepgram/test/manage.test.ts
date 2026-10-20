import { afterEach, describe, expect, test, vi } from 'vitest';
import { getProjectAction } from '../src/actions/get-project';
import { updateProjectAction } from '../src/actions/update-project';
import { listRequestsAction } from '../src/actions/list-requests';
import { getRequestAction } from '../src/actions/get-request';
import { getUsageAction } from '../src/actions/get-usage';
import { getBillingBreakdownAction } from '../src/actions/get-billing-breakdown';
import { getBalancesAction } from '../src/actions/get-balances';
import { listProjectKeysAction } from '../src/actions/list-project-keys';
import { listProjectMembersAction } from '../src/actions/list-project-members';
import { listProjectsAction } from '../src/actions/list-projects';
import { runAction, stubFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

const ONE_PROJECT = {
  projects: [{ project_id: 'p-1', name: 'Main', mip_opt_out: false }],
};

const requestRow = {
  request_id: 'req-9',
  project_uuid: 'p-1',
  created: '2026-10-11T14:46:00.000Z',
  path: '/v1/listen?callback=https%3A%2F%2Fu%3Asecret%40hooks.io%2Fcb&model=nova',
  api_key_id: 'key-1',
  response: {
    code: 200,
    completed: '2026-10-11T14:46:02.000Z',
    deployment: 'hosted:us',
    details: {
      channels: 1,
      duration: 25.9,
      total_audio: 25.9,
      method: 'async',
      models: ['m-1'],
      features: ['callback'],
      tags: ['ap'],
      usd: 0.0019,
      tier: 'nova',
    },
  },
  callback: { attempts: 10, code: 405 },
};

describe('project resolution', () => {
  test('uses the only project when none is chosen', async () => {
    const seen = stubFetch((request) =>
      request.url.endsWith('/projects')
        ? { body: ONE_PROJECT }
        : { body: { project_id: 'p-1', name: 'Main', mip_opt_out: true } }
    );
    const result = await runAction({
      action: getProjectAction,
      propsValue: {},
    });
    expect(seen.map((request) => request.url)).toEqual([
      'https://api.deepgram.com/v1/projects',
      'https://api.deepgram.com/v1/projects/p-1',
    ]);
    expect(result).toEqual({
      project_id: 'p-1',
      name: 'Main',
      mip_opt_out: true,
    });
  });

  test('asks to choose when the key has several projects', async () => {
    stubFetch(() => ({
      body: {
        projects: [
          { project_id: 'a', name: 'A' },
          { project_id: 'b', name: 'B' },
        ],
      },
    }));
    await expect(
      runAction({ action: getProjectAction, propsValue: {} })
    ).rejects.toThrow(
      'This API key can access 2 Deepgram projects. Choose one in the Project field: A (a), B (b).'
    );
  });

  test('uses a chosen project without listing', async () => {
    const seen = stubFetch(() => ({
      body: { balances: [{ balance_id: 'b-1', amount: 199.5, units: 'usd' }] },
    }));
    const result = await runAction({
      action: getBalancesAction,
      propsValue: { project: 'p/2' },
    });
    expect(seen.map((request) => request.url)).toEqual([
      'https://api.deepgram.com/v1/projects/p%2F2/balances',
    ]);
    expect(result).toEqual({
      balances: [
        {
          balance_id: 'b-1',
          amount: 199.5,
          units: 'usd',
          purchase_order_id: null,
        },
      ],
    });
  });
});

describe('update_project', () => {
  test('PATCHes only the trimmed name and returns the stored project', async () => {
    const seen = stubFetch((request) =>
      request.method === 'PATCH'
        ? { body: { message: 'Successfully updated project info.' } }
        : { body: { project_id: 'p-1', name: 'Renamed', mip_opt_out: false } }
    );
    const result = await runAction({
      action: updateProjectAction,
      propsValue: { project: 'p-1', name: '  Renamed ' },
    });
    expect(seen[0].method).toBe('PATCH');
    expect(seen[0].url).toBe('https://api.deepgram.com/v1/projects/p-1');
    expect(seen[0].json).toEqual({ name: 'Renamed' });
    expect(result).toEqual({
      project_id: 'p-1',
      name: 'Renamed',
      mip_opt_out: false,
      message: 'Successfully updated project info.',
    });
  });

  test('refuses an empty name', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    await expect(
      runAction({
        action: updateProjectAction,
        propsValue: { project: 'p-1', name: '   ' },
      })
    ).rejects.toThrow('Enter a new name');
    expect(seen).toHaveLength(0);
  });
});

describe('requests', () => {
  test('list_requests sends filters, masks callback credentials and reports has_more', async () => {
    const seen = stubFetch(() => ({
      body: { page: 0, limit: 1, requests: [requestRow] },
    }));
    const result = await runAction({
      action: listRequestsAction,
      propsValue: {
        project: 'p-1',
        start: '2026-10-01T00:00:00.000Z',
        end: '2026-10-11T23:59:59.000Z',
        endpoint: 'listen',
        method: 'async',
        status: 'succeeded',
        limit: 1,
      },
    });
    expect(seen[0].url).toBe(
      'https://api.deepgram.com/v1/projects/p-1/requests?start=2026-10-01T00%3A00%3A00Z&end=2026-10-11T23%3A59%3A59Z&endpoint=listen&method=async&status=succeeded&limit=1&page=0'
    );
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(result).toEqual({
      requests: [
        {
          request_id: 'req-9',
          created: '2026-10-11T14:46:00.000Z',
          completed: '2026-10-11T14:46:02.000Z',
          endpoint: 'listen',
          path: '/v1/listen?callback=https%3A%2F%2F***%40hooks.io%2Fcb&model=nova',
          api_key_id: 'key-1',
          status_code: 200,
          method: 'async',
          deployment: 'hosted:us',
          duration_seconds: 25.9,
          total_audio_seconds: 25.9,
          channels: 1,
          usd: 0.0019,
          models: 'm-1',
          features: 'callback',
          tags: 'ap',
          tier: 'nova',
          callback_status_code: 405,
          callback_attempts: 10,
        },
      ],
      page: 0,
      limit: 1,
      has_more: true,
    });
  });

  test.each([
    [{ limit: 0 }, 'Limit must be a whole number from 1 to 1000'],
    [{ limit: 1001 }, 'Limit must be a whole number from 1 to 1000'],
    [{ page: -1 }, 'Page must be a whole number from 0 up'],
    [
      { start: '2026-10-11', end: '2026-10-01' },
      'start date must be on or before',
    ],
    [{ start: 'yesterday' }, 'is not a valid date'],
  ])('list_requests rejects %j', async (props, message) => {
    const seen = stubFetch(() => ({ body: {} }));
    await expect(
      runAction({
        action: listRequestsAction,
        propsValue: { project: 'p-1', ...props },
      })
    ).rejects.toThrow(message);
    expect(seen).toHaveLength(0);
  });

  test('get_request flattens the top-level row Deepgram returns', async () => {
    const seen = stubFetch(() => ({ body: requestRow }));
    const result = await runAction({
      action: getRequestAction,
      propsValue: { project: 'p-1', requestId: ' req-9 ' },
    });
    expect(seen[0].url).toBe(
      'https://api.deepgram.com/v1/projects/p-1/requests/req-9'
    );
    expect(result).toEqual(
      expect.objectContaining({
        request_id: 'req-9',
        status_code: 200,
        usd: 0.0019,
        tier: 'nova',
        callback_status_code: 405,
        callback_attempts: 10,
        endpoint: 'listen',
      })
    );
    expect(JSON.stringify(result)).not.toContain('secret');
  });

  test.each([null, {}])(
    'get_request fails clearly when Deepgram returns %j for an unknown ID',
    async (body) => {
      stubFetch(() => ({ body }));
      await expect(
        runAction({
          action: getRequestAction,
          propsValue: { project: 'p-1', requestId: 'missing-1' },
        })
      ).rejects.toThrow('Deepgram has no request with ID missing-1');
    }
  );

  test('get_request also reads the documented wrapped row', async () => {
    stubFetch(() => ({ body: { request: requestRow } }));
    const result = await runAction({
      action: getRequestAction,
      propsValue: { project: 'p-1', requestId: 'req-9' },
    });
    expect(Reflect.get(Object(result), 'usd')).toBe(0.0019);
  });
});

describe('usage and billing', () => {
  test('get_usage sends day dates and grouping and totals the rows', async () => {
    const seen = stubFetch(() => ({
      body: {
        start: '2026-10-01',
        end: '2026-10-11',
        resolution: { units: 'day', amount: 1 },
        results: [
          {
            hours: 0.1,
            total_hours: 0.1,
            agent_hours: 0,
            tokens_in: 10,
            tokens_out: 5,
            tts_characters: 100,
            requests: 3,
            grouping: {
              start: '2026-10-01',
              end: '2026-10-01',
              endpoint: 'listen',
              models: ['Nova-3'],
            },
          },
          {
            hours: 0.2,
            total_hours: 0.2,
            agent_hours: 0,
            tokens_in: 0,
            tokens_out: 0,
            tts_characters: 0,
            requests: 1,
            grouping: {
              start: '2026-10-02',
              end: '2026-10-02',
              endpoint: 'speak',
            },
          },
        ],
      },
    }));
    const result = await runAction({
      action: getUsageAction,
      propsValue: {
        project: 'p-1',
        start: '2026-10-01T10:00:00.000Z',
        end: '2026-10-11',
        groupBy: 'endpoint',
        tag: ' ap ',
      },
    });
    expect(seen[0].url).toBe(
      'https://api.deepgram.com/v1/projects/p-1/usage/breakdown?start=2026-10-01&end=2026-10-11&grouping=endpoint&tag=ap'
    );
    expect(result).toEqual(
      expect.objectContaining({
        resolution: '1 day',
        total_hours: 0.3,
        total_requests: 4,
        total_tts_characters: 100,
        total_tokens_in: 10,
        total_tokens_out: 5,
      })
    );
    expect(Reflect.get(Object(result), 'results')[0]).toEqual(
      expect.objectContaining({
        endpoint: 'listen',
        models: 'Nova-3',
        tags: '',
      })
    );
  });

  test('get_billing_breakdown repeats grouping and rounds the total', async () => {
    const seen = stubFetch(() => ({
      body: {
        start: '2026-10-01',
        end: '2026-10-11',
        results: [
          {
            dollars: 0.1,
            grouping: { line_item: 'batch::nova-3', tags: ['a', 'b'] },
          },
          { dollars: 0.2, grouping: { line_item: 'speak::aura-2' } },
        ],
      },
    }));
    const result = await runAction({
      action: getBillingBreakdownAction,
      propsValue: { project: 'p-1', groupBy: ['line_item', 'tags'] },
    });
    expect(seen[0].url).toBe(
      'https://api.deepgram.com/v1/projects/p-1/billing/breakdown?grouping=line_item&grouping=tags'
    );
    expect(Reflect.get(Object(result), 'total_dollars')).toBe(0.3);
    expect(Reflect.get(Object(result), 'results')[0]).toEqual({
      dollars: 0.1,
      start: null,
      end: null,
      line_item: 'batch::nova-3',
      accessor: null,
      deployment: null,
      tags: 'a, b',
    });
  });
});

describe('members, keys and projects', () => {
  test('list_project_keys never returns a secret and flattens member data', async () => {
    const seen = stubFetch(() => ({
      body: {
        api_keys: [
          {
            member: { member_id: 'm-1', email: 'a@b.io' },
            api_key: {
              api_key_id: 'k-1',
              comment: 'CI',
              scopes: ['member'],
              created: '2026-01-01T00:00:00Z',
            },
          },
        ],
      },
    }));
    const result = await runAction({
      action: listProjectKeysAction,
      propsValue: { project: 'p-1', status: 'active' },
    });
    expect(seen[0].url).toBe(
      'https://api.deepgram.com/v1/projects/p-1/keys?status=active'
    );
    expect(result).toEqual({
      keys: [
        {
          api_key_id: 'k-1',
          comment: 'CI',
          scopes: 'member',
          created: '2026-01-01T00:00:00Z',
          expiration_date: null,
          member_id: 'm-1',
          member_email: 'a@b.io',
        },
      ],
    });
  });

  test('list_project_members joins scopes', async () => {
    stubFetch(() => ({
      body: {
        members: [
          {
            member_id: 'm-1',
            email: 'a@b.io',
            first_name: 'A',
            last_name: 'B',
            scopes: ['owner', 'admin'],
          },
        ],
      },
    }));
    await expect(
      runAction({
        action: listProjectMembersAction,
        propsValue: { project: 'p-1' },
      })
    ).resolves.toEqual({
      members: [
        {
          member_id: 'm-1',
          email: 'a@b.io',
          first_name: 'A',
          last_name: 'B',
          scopes: 'owner, admin',
        },
      ],
    });
  });

  test('list_projects keeps the vendor fields', async () => {
    stubFetch(() => ({ body: ONE_PROJECT }));
    await expect(
      runAction({ action: listProjectsAction, propsValue: {} })
    ).resolves.toEqual(ONE_PROJECT);
  });
});
