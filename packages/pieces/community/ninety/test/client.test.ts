/// <reference types="vitest/globals" />

const { sendRequest, FakeHttpError } = vi.hoisted(() => {
  class HoistedHttpError extends Error {
    constructor(
      private readonly status: number,
      private readonly body: unknown
    ) {
      super(JSON.stringify({ status, body }));
    }
    get response() {
      return { status: this.status, body: this.body };
    }
  }
  return { sendRequest: vi.fn(), FakeHttpError: HoistedHttpError };
});

vi.mock('@activepieces/pieces-common', () => ({
  HttpMethod: {
    GET: 'GET',
    POST: 'POST',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
  },
  AuthenticationType: { BEARER_TOKEN: 'BEARER_TOKEN' },
  HttpError: FakeHttpError,
  httpClient: {
    sendRequest: (...args: unknown[]) => sendRequest(...args),
  },
}));

import { ninetyCommon } from '../src/lib/common/client';

const token = 'a-personal-access-token';

const lastRequest = () => sendRequest.mock.calls.at(-1)?.[0];

function reply(body: unknown) {
  sendRequest.mockResolvedValueOnce({ body });
}

beforeEach(() => sendRequest.mockReset());

describe('request shaping', () => {
  test('paths are joined onto the public v1 base url', async () => {
    reply([]);
    await ninetyCommon.listTeams({ token });
    expect(lastRequest().url).toBe('https://api.public.ninety.io/v1/teams');
  });

  test('a token pasted with whitespace is trimmed before it is sent', async () => {
    reply([]);
    await ninetyCommon.listTeams({ token: '  padded-token\n' });
    expect(lastRequest().authentication).toEqual({
      type: 'BEARER_TOKEN',
      token: 'padded-token',
    });
  });

  test('an id is url encoded into the path', async () => {
    reply({});
    await ninetyCommon.updateTodo({
      token,
      todoId: 'a b/c',
      todo: { title: 'x' },
    });
    expect(lastRequest().url).toBe(
      'https://api.public.ninety.io/v1/todos/a%20b%2Fc'
    );
  });

  test('a request with no body omits the body key rather than sending null', async () => {
    reply([]);
    await ninetyCommon.listTeams({ token });
    expect('body' in lastRequest()).toBe(false);
  });
});

describe('query envelopes', () => {
  test('a bare array response is read as the items', async () => {
    reply([{ _id: '1' }, { _id: '2' }]);
    const { items, totalCount } = await ninetyCommon.queryTodos({
      token,
      query: {},
    });
    expect(items).toHaveLength(2);
    expect(totalCount).toBe(2);
  });

  test('a paged envelope response is unwrapped and keeps its own total', async () => {
    reply({ items: [{ _id: '1' }], totalCount: 57 });
    const { items, totalCount } = await ninetyCommon.queryIssues({
      token,
      query: {},
    });
    expect(items).toHaveLength(1);
    expect(totalCount).toBe(57);
  });

  test('a null response yields no items instead of throwing', async () => {
    reply(null);
    const { items, totalCount } = await ninetyCommon.queryTodos({
      token,
      query: {},
    });
    expect(items).toEqual([]);
    expect(totalCount).toBe(0);
  });

  test('an envelope with no items key yields no items', async () => {
    reply({ totalCount: 0 });
    const { items } = await ninetyCommon.queryMeasurables({
      token,
      query: {},
    });
    expect(items).toEqual([]);
  });
});

describe('endpoint choices that are easy to get wrong', () => {
  test('rocks are queried through the paged endpoint, not the team-keyed one', async () => {
    reply({ items: [], totalCount: 0 });
    await ninetyCommon.queryRocks({ token, query: {} });
    expect(lastRequest().url).toBe(
      'https://api.public.ninety.io/v1/rocks/query/paged'
    );
  });

  test('a rock is created inside a nested rock object', async () => {
    reply({ _id: 'r1' });
    await ninetyCommon.createRock({
      token,
      rock: {
        teamId: 't1',
        title: 'Cut onboarding time',
        dueDate: '2026-09-30T00:00:00.000Z',
        statusCode: 'ON_TRACK',
        levelCode: 'USER',
        quarter: 'Q3',
      },
    });
    expect(lastRequest().body).toEqual({
      rock: {
        teamId: 't1',
        title: 'Cut onboarding time',
        dueDate: '2026-09-30T00:00:00.000Z',
        statusCode: 'ON_TRACK',
        levelCode: 'USER',
        quarter: 'Q3',
      },
    });
  });

  test('the follower flag is only sent when it was chosen', async () => {
    reply({ _id: 'r1' });
    await ninetyCommon.createRock({
      token,
      rock: {
        teamId: 't1',
        title: 'x',
        dueDate: '2026-09-30T00:00:00.000Z',
        statusCode: 'ON_TRACK',
        levelCode: 'USER',
        quarter: 'Q3',
      },
      addCreatorToFollowersList: true,
    });
    expect(lastRequest().body.addCreatorToFollowersList).toBe(true);
  });

  test('users are listed per team when a team is given', async () => {
    reply([]);
    await ninetyCommon.listUsers({ token, teamId: 't1' });
    expect(lastRequest().url).toBe(
      'https://api.public.ninety.io/v1/users/team/t1'
    );
  });

  test('users fall back to the whole directory when no team is given', async () => {
    reply([]);
    await ninetyCommon.listUsers({ token });
    expect(lastRequest().url).toBe('https://api.public.ninety.io/v1/users');
  });

  test('a blank team id is treated as no team, not as an empty path segment', async () => {
    reply([]);
    await ninetyCommon.listUsers({ token, teamId: '   ' });
    expect(lastRequest().url).toBe('https://api.public.ninety.io/v1/users');
  });
});

describe('date normalisation', () => {
  test('a date-only value is passed through untouched', () => {
    expect(
      ninetyCommon.toDateOnly({ value: '2026-09-11', field: 'Due Date' })
    ).toBe('2026-09-11');
  });

  test('a full timestamp is narrowed to the day Ninety wants for a to-do', () => {
    expect(
      ninetyCommon.toDateOnly({
        value: '2026-09-11T14:30:00.000Z',
        field: 'Due Date',
      })
    ).toBe('2026-09-11');
  });

  test('a rock keeps the full timestamp', () => {
    expect(
      ninetyCommon.toIsoDate({ value: '2026-09-30', field: 'Due Date' })
    ).toBe('2026-09-30T00:00:00.000Z');
  });

  test('an unparseable date names the field it came from', () => {
    expect(() =>
      ninetyCommon.toIsoDate({ value: 'next tuesday', field: 'Due Date' })
    ).toThrow(/Due Date is not a valid date/);
  });

  test('an absent optional date stays absent rather than becoming today', () => {
    expect(
      ninetyCommon.toOptionalDateOnly({ value: undefined, field: 'Due Date' })
    ).toBeUndefined();
    expect(
      ninetyCommon.toOptionalIsoDate({ value: undefined, field: 'Due Date' })
    ).toBeUndefined();
  });
});

describe('error messages', () => {
  test('a 401 explains where to regenerate the token', async () => {
    sendRequest.mockRejectedValueOnce(new FakeHttpError(401, 'Unauthorized'));
    await expect(ninetyCommon.listTeams({ token })).rejects.toThrow(
      /Developer Settings/
    );
  });

  test('a 403 names the Thrive plan rather than looking like a bad token', async () => {
    sendRequest.mockRejectedValueOnce(new FakeHttpError(403, 'Forbidden'));
    await expect(ninetyCommon.listTeams({ token })).rejects.toThrow(/Thrive/);
  });

  test('a 429 states the documented rate limit', async () => {
    sendRequest.mockRejectedValueOnce(new FakeHttpError(429, 'Slow down'));
    await expect(ninetyCommon.listTeams({ token })).rejects.toThrow(
      /25 requests per second/
    );
  });

  test('an unmapped status is passed through untouched so the API message survives', async () => {
    const original = new FakeHttpError(422, { message: 'title is required' });
    sendRequest.mockRejectedValueOnce(original);
    await expect(ninetyCommon.listTeams({ token })).rejects.toBe(original);
  });

  test('a non-http failure is passed through untouched', async () => {
    const original = new Error('socket hang up');
    sendRequest.mockRejectedValueOnce(original);
    await expect(ninetyCommon.listTeams({ token })).rejects.toBe(original);
  });
});

describe('user labels', () => {
  test('first and last name are joined', () => {
    expect(
      ninetyCommon.userLabel({ id: 'u1', firstName: 'Amina', lastName: 'Haddad' })
    ).toBe('Amina Haddad');
  });

  test('the primary email stands in when no name is known', () => {
    expect(
      ninetyCommon.userLabel({ id: 'u1', primaryEmail: 'amina@example.com' })
    ).toBe('amina@example.com');
  });

  test('the id is the last resort, so an option is never blank', () => {
    expect(ninetyCommon.userLabel({ id: 'u1' })).toBe('u1');
  });

  test('a whitespace-only name does not produce a blank label', () => {
    expect(ninetyCommon.userLabel({ id: 'u1', firstName: '   ' })).toBe('u1');
  });

  test('the label reads id, not _id, which Ninety does not send for users', () => {
    const userWithNoRealId = { id: 'u1', _id: 'wrong' } as unknown as Parameters<
      typeof ninetyCommon.userLabel
    >[0];
    expect(ninetyCommon.userLabel(userWithNoRealId)).toBe('u1');
  });
});
