import { AppConnectionType } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { twentyApi } from '../src/lib/common/api';
import { twentyClient } from '../src/lib/common/client';
import { recordParamsUtils } from '../src/lib/common/record-params';
import type {
  FieldValue,
  QueryConditionNode,
  TwentyAuthValue,
} from '../src/lib/common/types';

vi.mock('../src/lib/common/client', () => ({
  twentyClient: { request: vi.fn() },
}));

const request = vi.mocked(twentyClient.request);

const auth: TwentyAuthValue = {
  type: AppConnectionType.CUSTOM_AUTH,
  props: { base_url: 'https://twenty.example.com', api_key: 'key' },
};

function sentFilter({ call }: { call: number }): unknown {
  return request.mock.calls[call]?.[0].query?.['filter'];
}

async function renderFilter({
  conditions,
}: {
  conditions: QueryConditionNode[];
}): Promise<unknown> {
  request.mockResolvedValueOnce({ data: { people: [] } });
  await twentyApi.findRecords({ auth, objectNamePlural: 'people', conditions });
  return sentFilter({ call: 0 });
}

beforeEach(() => {
  request.mockReset();
});

describe('filter format', () => {
  it.each<[string, QueryConditionNode, string]>([
    ['quotes a string value', { field: 'name', operator: 'eq', value: 'Acme' }, 'name[eq]:"Acme"'],
    ['leaves a number unquoted', { field: 'employees', operator: 'gt', value: 10 }, 'employees[gt]:10'],
    ['leaves a boolean unquoted', { field: 'active', operator: 'eq', value: true }, 'active[eq]:true'],
    ['leaves the is keyword unquoted', { field: 'email', operator: 'is', value: 'NULL' }, 'email[is]:NULL'],
    ['quotes a like pattern', { field: 'name', operator: 'like', value: '%Acme%' }, 'name[like]:"%Acme%"'],
    ['quotes an ilike pattern', { field: 'name', operator: 'ilike', value: '%acme%' }, 'name[ilike]:"%acme%"'],
    ['renders a list as a JSON array', { field: 'id', operator: 'in', value: ['a', 'b'] }, 'id[in]:["a","b"]'],
  ])('%s', async (_, condition, expected) => {
    expect(await renderFilter({ conditions: [condition] })).toBe(expected);
  });

  it('renders groups with their conjunction around the children', async () => {
    const filter = await renderFilter({
      conditions: [
        {
          conjunction: 'or',
          conditions: [
            { field: 'name', operator: 'eq', value: 'A' },
            {
              conjunction: 'not',
              conditions: [{ field: 'city', operator: 'eq', value: 'B' }],
            },
          ],
        },
      ],
    });

    expect(filter).toBe('or(name[eq]:"A",not(city[eq]:"B"))');
  });

  it('joins top level conditions with a comma', async () => {
    const filter = await renderFilter({
      conditions: [
        { field: 'name', operator: 'eq', value: 'A' },
        { field: 'city', operator: 'eq', value: 'B' },
      ],
    });

    expect(filter).toBe('name[eq]:"A",city[eq]:"B"');
  });
});

describe('filter pruning', () => {
  it.each<[string, FieldValue | undefined]>([
    ['an empty string', ''],
    ['an empty list', []],
    ['undefined', undefined],
  ])('drops a condition whose value is %s', async (_, value) => {
    const filter = await renderFilter({
      conditions: [
        { field: 'name', operator: 'eq', value },
        { field: 'city', operator: 'eq', value: 'B' },
      ],
    });

    expect(filter).toBe('city[eq]:"B"');
  });

  it('sends no filter when every condition is empty', async () => {
    request.mockResolvedValueOnce({ data: { people: [] } });
    await twentyApi.findRecords({
      auth,
      objectNamePlural: 'people',
      conditions: [{ field: 'name', operator: 'eq', value: '' }],
    });

    expect(request.mock.calls[0]?.[0].query).toEqual({ limit: '200' });
  });

  it('collapses a group left with one child into that child', async () => {
    const filter = await renderFilter({
      conditions: [
        {
          conjunction: 'or',
          conditions: [
            { field: 'name', operator: 'eq', value: '' },
            { field: 'city', operator: 'eq', value: 'B' },
          ],
        },
      ],
    });

    expect(filter).toBe('city[eq]:"B"');
  });

  it('keeps a not group with one child so its meaning is not flipped', async () => {
    const filter = await renderFilter({
      conditions: [
        {
          conjunction: 'not',
          conditions: [{ field: 'city', operator: 'eq', value: 'B' }],
        },
      ],
    });

    expect(filter).toBe('not(city[eq]:"B")');
  });

  it('removes a group whose children are all empty', async () => {
    const filter = await renderFilter({
      conditions: [
        {
          conjunction: 'and',
          conditions: [
            { field: 'name', operator: 'eq', value: '' },
            {
              conjunction: 'not',
              conditions: [{ field: 'city', operator: 'eq', value: [] }],
            },
          ],
        },
        { field: 'stage', operator: 'eq', value: 'WON' },
      ],
    });

    expect(filter).toBe('stage[eq]:"WON"');
  });
});

describe('updateRecords', () => {
  it('never sends a bulk update without a filter for a filter the user left blank', async () => {
    request.mockResolvedValue({ data: { updatePeople: [] } });
    const conditions = recordParamsUtils.parseQueryConditions({
      input: { email_operator: 'eq', email_value: '' },
    });

    const result = twentyApi.updateRecords({
      auth,
      objectNamePlural: 'people',
      conditions,
      recordValues: { jobTitle: 'CTO' },
    });

    await expect(result).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });

  it('sends the rendered filter with the update', async () => {
    request.mockResolvedValueOnce({ data: { updatePeople: [{ id: '1' }] } });

    const result = await twentyApi.updateRecords({
      auth,
      objectNamePlural: 'people',
      conditions: [{ field: 'city', operator: 'eq', value: 'Paris' }],
      recordValues: { jobTitle: 'CTO' },
    });

    expect(result).toEqual([{ id: '1' }]);
    expect(request).toHaveBeenCalledWith({
      auth,
      method: HttpMethod.PATCH,
      path: '/rest/people',
      query: { filter: 'city[eq]:"Paris"' },
      body: { jobTitle: 'CTO' },
    });
  });
});

describe('deleteRecords', () => {
  it('never sends a bulk delete without a filter', async () => {
    const result = twentyApi.deleteRecords({
      auth,
      objectNamePlural: 'people',
      conditions: [{ field: 'city', operator: 'eq', value: '' }],
      permanent: false,
    });

    await expect(result).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });

  it('moves the matching records to the trash', async () => {
    request.mockResolvedValueOnce({ data: { deletePeople: [{ id: '1' }] } });

    const result = await twentyApi.deleteRecords({
      auth,
      objectNamePlural: 'people',
      conditions: [{ field: 'city', operator: 'eq', value: 'Paris' }],
      permanent: false,
    });

    expect(result).toEqual([{ id: '1' }]);
    expect(request).toHaveBeenCalledWith({
      auth,
      method: HttpMethod.DELETE,
      path: '/rest/people',
      query: { filter: 'city[eq]:"Paris"', soft_delete: 'true' },
    });
  });

  it('never sends a permanent bulk delete without a filter', async () => {
    const result = twentyApi.deleteRecords({
      auth,
      objectNamePlural: 'people',
      conditions: [{ field: 'city', operator: 'eq', value: '' }],
      permanent: true,
    });

    await expect(result).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });

  it('leaves out soft_delete so the matching records are destroyed', async () => {
    request.mockResolvedValueOnce({ data: { deletePeople: [{ id: '1' }] } });

    const result = await twentyApi.deleteRecords({
      auth,
      objectNamePlural: 'people',
      conditions: [{ field: 'city', operator: 'eq', value: 'Paris' }],
      permanent: true,
    });

    expect(result).toEqual([{ id: '1' }]);
    expect(request).toHaveBeenCalledWith({
      auth,
      method: HttpMethod.DELETE,
      path: '/rest/people',
      query: { filter: 'city[eq]:"Paris"' },
    });
  });
});

describe('limit', () => {
  it('sends the limit with a find', async () => {
    request.mockResolvedValueOnce({ data: { people: [] } });

    await twentyApi.findRecords({
      auth,
      objectNamePlural: 'people',
      conditions: [{ field: 'city', operator: 'eq', value: 'Paris' }],
      limit: 25,
    });

    expect(request.mock.calls[0]?.[0].query).toEqual({
      filter: 'city[eq]:"Paris"',
      limit: '25',
    });
  });

  it('deletes only the ids found within the limit that still match the filter', async () => {
    request
      .mockResolvedValueOnce({ data: { people: [{ id: 'a' }, { id: 'b' }] } })
      .mockResolvedValueOnce({ data: { deletePeople: [{ id: 'a' }, { id: 'b' }] } });

    const result = await twentyApi.deleteRecords({
      auth,
      objectNamePlural: 'people',
      conditions: [{ field: 'city', operator: 'eq', value: 'Paris' }],
      permanent: false,
      limit: 2,
    });

    expect(result).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(request.mock.calls[0]?.[0].query).toEqual({
      filter: 'city[eq]:"Paris"',
      limit: '2',
    });
    expect(request).toHaveBeenLastCalledWith({
      auth,
      method: HttpMethod.DELETE,
      path: '/rest/people',
      query: {
        filter: 'id[in]:["a","b"],city[eq]:"Paris"',
        soft_delete: 'true',
      },
    });
  });

  it('sends no delete when nothing matches', async () => {
    request.mockResolvedValueOnce({ data: { people: [] } });

    const result = await twentyApi.deleteRecords({
      auth,
      objectNamePlural: 'people',
      conditions: [{ field: 'city', operator: 'eq', value: 'Paris' }],
      permanent: true,
      limit: 10,
    });

    expect(result).toEqual([]);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('updates only the ids found within the limit that still match the filter', async () => {
    request
      .mockResolvedValueOnce({ data: { people: [{ id: 'a' }] } })
      .mockResolvedValueOnce({ data: { updatePeople: [{ id: 'a' }] } });

    const result = await twentyApi.updateRecords({
      auth,
      objectNamePlural: 'people',
      conditions: [{ field: 'city', operator: 'eq', value: 'Paris' }],
      recordValues: { jobTitle: 'CTO' },
      limit: 1,
    });

    expect(result).toEqual([{ id: 'a' }]);
    expect(request).toHaveBeenLastCalledWith({
      auth,
      method: HttpMethod.PATCH,
      path: '/rest/people',
      query: { filter: 'id[in]:["a"],city[eq]:"Paris"' },
      body: { jobTitle: 'CTO' },
    });
  });

  it('checks the filter before looking anything up', async () => {
    const result = twentyApi.updateRecords({
      auth,
      objectNamePlural: 'people',
      conditions: [{ field: 'city', operator: 'eq', value: '' }],
      recordValues: { jobTitle: 'CTO' },
      limit: 10,
    });

    await expect(result).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });
});

describe('pagination', () => {
  function page({
    ids,
    endCursor,
  }: {
    ids: string[];
    endCursor?: string;
  }): unknown {
    return {
      data: { people: ids.map((id) => ({ id })) },
      pageInfo: { hasNextPage: endCursor !== undefined, endCursor },
    };
  }

  it('follows the cursor until the last page when there is no limit', async () => {
    request
      .mockResolvedValueOnce(page({ ids: ['a', 'b'], endCursor: 'c1' }))
      .mockResolvedValueOnce(page({ ids: ['c'] }));

    const result = await twentyApi.listAllRecords({
      auth,
      objectNamePlural: 'people',
    });

    expect(result).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    expect(request.mock.calls.map((call) => call[0].query)).toEqual([
      { limit: '200' },
      { limit: '200', starting_after: 'c1' },
    ]);
  });

  it('asks only for the records still needed and stops at the limit', async () => {
    request
      .mockResolvedValueOnce(
        page({ ids: Array.from({ length: 200 }, (_, i) => `r${i}`), endCursor: 'c1' })
      )
      .mockResolvedValueOnce(page({ ids: ['x', 'y'], endCursor: 'c2' }));

    const result = await twentyApi.listAllRecords({
      auth,
      objectNamePlural: 'people',
      limit: 202,
    });

    expect(result).toHaveLength(202);
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[1]?.[0].query).toEqual({
      limit: '2',
      starting_after: 'c1',
    });
  });

  it('stops when a page has no cursor even if it claims more pages', async () => {
    request.mockResolvedValueOnce({
      data: { people: [{ id: 'a' }] },
      pageInfo: { hasNextPage: true, endCursor: null },
    });

    const result = await twentyApi.listAllRecords({
      auth,
      objectNamePlural: 'people',
    });

    expect(result).toEqual([{ id: 'a' }]);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('deletes in batches of 100 ids', async () => {
    const ids = Array.from({ length: 150 }, (_, i) => `r${i}`);
    request
      .mockResolvedValueOnce(page({ ids }))
      .mockResolvedValueOnce({ data: { deletePeople: ids.slice(0, 100).map((id) => ({ id })) } })
      .mockResolvedValueOnce({ data: { deletePeople: ids.slice(100).map((id) => ({ id })) } });

    const result = await twentyApi.deleteRecords({
      auth,
      objectNamePlural: 'people',
      conditions: [{ field: 'city', operator: 'eq', value: 'Paris' }],
      permanent: false,
      limit: 500,
    });

    expect(result).toHaveLength(150);
    expect(request).toHaveBeenCalledTimes(3);
    expect(request.mock.calls[1]?.[0].query?.['filter']).toBe(
      `id[in]:${JSON.stringify(ids.slice(0, 100))},city[eq]:"Paris"`
    );
    expect(request.mock.calls[2]?.[0].query?.['filter']).toBe(
      `id[in]:${JSON.stringify(ids.slice(100))},city[eq]:"Paris"`
    );
  });
});

describe('getRecordsByIds', () => {
  it('makes no request for an empty id list', async () => {
    const result = await twentyApi.getRecordsByIds({
      auth,
      objectNamePlural: 'people',
      recordIds: [],
    });

    expect(result).toEqual([]);
    expect(request).not.toHaveBeenCalled();
  });

  it('filters on the ids and limits the page to their count', async () => {
    request.mockResolvedValueOnce({ data: { people: [{ id: 'a' }, { id: 'b' }] } });

    const result = await twentyApi.getRecordsByIds({
      auth,
      objectNamePlural: 'people',
      recordIds: ['a', 'b'],
    });

    expect(result).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(request.mock.calls[0]?.[0].query).toEqual({
      filter: 'id[in]:["a","b"]',
      limit: '2',
    });
  });
});

describe('listRecords', () => {
  it('drops empty query values and sends the rest as strings', async () => {
    request.mockResolvedValueOnce({ data: { people: [] } });

    await twentyApi.listRecords({
      auth,
      objectNamePlural: 'people',
      filter: '',
      orderBy: undefined,
      limit: 0,
      depth: 1,
    });

    expect(request.mock.calls[0]?.[0].query).toEqual({ limit: '0', depth: '1' });
  });
});

describe('updateRecord with appendArrays', () => {
  it('merges array fields with the existing record without duplicates', async () => {
    request
      .mockResolvedValueOnce({
        data: { person: { id: '1', tags: ['a', 'b'], jobTitle: 'CEO' } },
      })
      .mockResolvedValueOnce({ data: { updatePerson: { id: '1' } } });

    await twentyApi.updateRecord({
      auth,
      objectNamePlural: 'people',
      recordId: '1',
      recordValues: { tags: ['b', 'c'], jobTitle: 'CTO' },
      appendArrays: true,
    });

    expect(request.mock.calls[1]?.[0].body).toEqual({
      tags: ['a', 'b', 'c'],
      jobTitle: 'CTO',
    });
  });

  it('overwrites an array field when the existing value is not an array', async () => {
    request
      .mockResolvedValueOnce({ data: { person: { id: '1', tags: null } } })
      .mockResolvedValueOnce({ data: { updatePerson: { id: '1' } } });

    await twentyApi.updateRecord({
      auth,
      objectNamePlural: 'people',
      recordId: '1',
      recordValues: { tags: ['c'] },
      appendArrays: true,
    });

    expect(request.mock.calls[1]?.[0].body).toEqual({ tags: ['c'] });
  });
});

describe('listTimelines', () => {
  const since = Date.parse('2026-01-01T00:00:00.000Z');
  const until = Date.parse('2026-01-02T00:00:00.000Z');

  it('asks for activities of the object inside the time window', async () => {
    request.mockResolvedValueOnce({ data: { timelineActivities: [] } });

    await twentyApi.listTimelines({ auth, targetColumn: 'targetPersonId', since, until });

    expect(sentFilter({ call: 0 })).toBe(
      'targetPersonId[is]:NOT_NULL,linkedRecordId[is]:NULL,' +
        'updatedAt[gt]:"2026-01-01T00:00:00.000Z",updatedAt[lte]:"2026-01-02T00:00:00.000Z"'
    );
  });

  it('keeps the cursor at since when there are no activities', async () => {
    request.mockResolvedValueOnce({ data: { timelineActivities: [] } });

    const result = await twentyApi.listTimelines({
      auth,
      targetColumn: 'targetPersonId',
      since,
      until,
    });

    expect(result).toEqual({ activities: [], cursor: since });
  });

  it('moves the cursor to the newest row and skips malformed rows', async () => {
    const valid = {
      id: 't1',
      targetPersonId: 'p1',
      createdAt: '2026-01-01T01:00:00.000Z',
      updatedAt: '2026-01-01T01:00:00.000Z',
      workspaceMemberId: 'm1',
      properties: { diff: { jobTitle: { before: 'A', after: 'B' } } },
    };
    const malformed = {
      id: 't2',
      targetPersonId: 'p1',
      createdAt: '2026-01-01T02:00:00.000Z',
      updatedAt: '2026-01-01T02:00:00.000Z',
      properties: { diff: {} },
    };
    request.mockResolvedValueOnce({ data: { timelineActivities: [valid, malformed] } });

    const result = await twentyApi.listTimelines({
      auth,
      targetColumn: 'targetPersonId',
      since,
      until,
    });

    expect(result.cursor).toBe(Date.parse('2026-01-01T02:00:00.000Z'));
    expect(result.activities.map((activity) => activity.id)).toEqual(['t1']);
  });
});
