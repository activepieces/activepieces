/// <reference types="vitest/globals" />

const { sendRequest } = vi.hoisted(() => ({ sendRequest: vi.fn() }));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@activepieces/pieces-common')
  >();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

import { ninetyProps } from '../src/lib/common/props';
import { ninetyAuth } from '../src/lib/auth';

const auth = { secret_text: 'a-token' };

function reply(body: unknown) {
  sendRequest.mockResolvedValueOnce({ body });
}

function fail(message: string) {
  sendRequest.mockRejectedValueOnce(new Error(message));
}

function options(property: {
  options: (propsValue: Record<string, unknown>) => Promise<{
    disabled?: boolean;
    placeholder?: string;
    options: { label: string; value: unknown }[];
  }>;
}) {
  return property.options.bind(property);
}

beforeEach(() => sendRequest.mockReset());

describe('the team dropdown', () => {
  test('is disabled with no connection yet', async () => {
    const result = await options(ninetyProps.teamIdOptional)({ auth: undefined });
    expect(result.disabled).toBe(true);
  });

  test('maps each team to its _id, which is what Ninety uses for teams', async () => {
    reply([{ _id: 't1', name: 'Leadership' }]);
    const result = await options(ninetyProps.teamIdOptional)({ auth });
    expect(result.options).toEqual([{ label: 'Leadership', value: 't1' }]);
  });

  test('is disabled with a placeholder when the token owner is on no team', async () => {
    reply([]);
    const result = await options(ninetyProps.teamIdOptional)({ auth });
    expect(result.disabled).toBe(true);
    expect(result.placeholder).toMatch(/not on any Ninety team/);
  });

  test('surfaces the load failure as the placeholder instead of throwing', async () => {
    fail('rate limited');
    const result = await options(ninetyProps.teamIdOptional)({ auth });
    expect(result.disabled).toBe(true);
    expect(result.placeholder).toBe('rate limited');
  });
});

describe('the owner dropdown, which is the one place _id would silently break everything', () => {
  test('maps each user to id, not _id, since Ninety does not send _id for users', async () => {
    reply([{ id: 'u1', firstName: 'Ada', lastName: 'Lovelace' }]);
    const result = await options(ninetyProps.ownerIdFilter)({
      auth,
      teamId: undefined,
    });
    expect(result.options).toEqual([{ label: 'Ada Lovelace', value: 'u1' }]);
  });

  test('is disabled with no connection yet', async () => {
    const result = await options(ninetyProps.ownerIdFilter)({
      auth: undefined,
      teamId: undefined,
    });
    expect(result.disabled).toBe(true);
  });

  test('is disabled with a placeholder when nobody is visible to the token', async () => {
    reply([]);
    const result = await options(ninetyProps.ownerIdFilter)({
      auth,
      teamId: undefined,
    });
    expect(result.disabled).toBe(true);
    expect(result.placeholder).toMatch(/No users visible/);
  });

  test('is scoped to the chosen team', async () => {
    reply([]);
    await options(ninetyProps.ownerIdFilter)({ auth, teamId: 'team-1' });
    expect(sendRequest.mock.calls.at(-1)?.[0]?.url).toBe(
      'https://api.public.ninety.io/v1/users/team/team-1'
    );
  });
});

describe('the owners multi-select, the other place the same _id bug could hide', () => {
  test('maps each user to id, not _id', async () => {
    reply([{ id: 'u1', primaryEmail: 'ada@example.com' }]);
    const result = await options(ninetyProps.ownerIds)({
      auth,
      teamId: undefined,
    });
    expect(result.options).toEqual([{ label: 'ada@example.com', value: 'u1' }]);
  });

  test('is disabled with no connection yet', async () => {
    const result = await options(ninetyProps.ownerIds)({
      auth: undefined,
      teamId: undefined,
    });
    expect(result.disabled).toBe(true);
  });
});

describe('the rock dropdown used to pick a milestone parent', () => {
  test('is disabled until a team is chosen', async () => {
    const result = await options(ninetyProps.rockId)({
      auth,
      teamId: undefined,
    });
    expect(result.disabled).toBe(true);
    expect(result.placeholder).toMatch(/Pick a team first/);
  });

  test('maps each rock to its _id and title', async () => {
    reply({ items: [{ _id: 'r1', title: 'Cut onboarding time' }] });
    const result = await options(ninetyProps.rockId)({
      auth,
      teamId: 'team-1',
    });
    expect(result.options).toEqual([
      { label: 'Cut onboarding time', value: 'r1' },
    ]);
  });

  test('is disabled with a placeholder when the team has no active rocks', async () => {
    reply({ items: [] });
    const result = await options(ninetyProps.rockId)({
      auth,
      teamId: 'team-1',
    });
    expect(result.disabled).toBe(true);
    expect(result.placeholder).toMatch(/no active rocks/);
  });
});

describe('the measurable dropdown', () => {
  test('maps each measurable to its _id and title', async () => {
    reply({ items: [{ _id: 'k1', title: 'Weekly signups' }] });
    const result = await options(ninetyProps.measurableId)({
      auth,
      teamId: undefined,
    });
    expect(result.options).toEqual([
      { label: 'Weekly signups', value: 'k1' },
    ]);
  });

  test('is disabled with no connection yet', async () => {
    const result = await options(ninetyProps.measurableId)({
      auth: undefined,
      teamId: undefined,
    });
    expect(result.disabled).toBe(true);
  });
});

describe('the additional-teams multi-select', () => {
  test('maps each team to its _id', async () => {
    reply([{ _id: 't2', name: 'Sales' }]);
    const result = await options(ninetyProps.additionalTeamIds)({ auth });
    expect(result.options).toEqual([{ label: 'Sales', value: 't2' }]);
  });

  test('surfaces the load failure as the placeholder', async () => {
    fail('boom');
    const result = await options(ninetyProps.additionalTeamIds)({ auth });
    expect(result.disabled).toBe(true);
    expect(result.placeholder).toBe('boom');
  });
});

describe('validating the connection', () => {
  test('a working token is accepted', async () => {
    reply([]);
    const result = await ninetyAuth.validate({ auth: 'a-token' });
    expect(result).toEqual({ valid: true });
  });

  test('a rejected token surfaces Ninety’s own hint', async () => {
    const { HttpError } = await vi.importActual<
      typeof import('@activepieces/pieces-common')
    >('@activepieces/pieces-common');
    sendRequest.mockRejectedValueOnce(
      new HttpError(undefined, { status: 401, responseBody: 'Unauthorized' })
    );
    const result = await ninetyAuth.validate({ auth: 'bad-token' });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toMatch(/Developer Settings/);
    }
  });

  test('an unreachable API gets a fallback message instead of a blank one', async () => {
    sendRequest.mockRejectedValueOnce(new Error());
    const result = await ninetyAuth.validate({ auth: 'a-token' });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toMatch(/could not be reached/);
    }
  });
});
