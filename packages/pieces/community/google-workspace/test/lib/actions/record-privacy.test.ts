import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const network = vi.hoisted(() => ({ unexpectedCalls: 0 }));
const fetchMock = vi.hoisted(() =>
  vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>(async () => {
    network.unexpectedCalls++;
    throw new Error('Unexpected real network call');
  })
);
vi.stubGlobal('fetch', fetchMock);

const { addRecord } = await import('../../../src/lib/actions/add-record');
const { updateRecord } = await import('../../../src/lib/actions/update-record');

const AUTH = { type: 'OAUTH2', access_token: 'ya29.oauth-token' };
const PASSWORD = 'Sup3r-Secret-Passw0rd!';
const RECOVERY_PHONE = '+15550001111';
const USER = {
  primaryEmail: 'jane@example.com',
  name: { givenName: 'Jane', familyName: 'Doe' },
  password: PASSWORD,
  recoveryPhone: RECOVERY_PHONE,
  customSchemas: { HR: { salary: 'confidential-123' } },
};
const SECRETS = [PASSWORD, RECOVERY_PHONE, 'confidential-123'];

type Runnable = { run: (ctx: unknown) => Promise<unknown> };

function errorText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  while (current !== undefined && current !== null) {
    parts.push(current instanceof Error ? `${current.message} ${current.stack ?? ''}` : String(current));
    parts.push(typeof current === 'object' ? JSON.stringify(current, Object.getOwnPropertyNames(current)) : String(current));
    current = current instanceof Error ? current.cause : undefined;
  }
  return parts.join('\n');
}

const consoleSpies: ReturnType<typeof vi.spyOn>[] = [];

beforeEach(() => {
  network.unexpectedCalls = 0;
  fetchMock.mockReset().mockImplementation(async () => {
    network.unexpectedCalls++;
    throw new Error('Unexpected real network call');
  });
  vi.stubGlobal('fetch', fetchMock);
  consoleSpies.length = 0;
  for (const level of ['error', 'warn', 'log', 'info', 'debug'] as const) {
    consoleSpies.push(vi.spyOn(console, level).mockImplementation(() => undefined));
  }
});

afterEach(() => {
  expect(network.unexpectedCalls).toBe(0);
  vi.restoreAllMocks();
});

describe('user writes carrying a password', () => {
  it.each([
    {
      status: 400,
      body: { error: { code: 400, message: 'Invalid Password', errors: [{ domain: 'global', reason: 'invalid', message: 'Invalid Password' }] } },
      message: 'Google Workspace API returned 400: invalid: Invalid Password',
    },
    {
      status: 409,
      body: { error: { code: 409, message: 'Entity already exists.', errors: [{ domain: 'global', reason: 'duplicate', message: 'Entity already exists.' }] } },
      message: 'Google Workspace API returned 409: duplicate: Entity already exists. A record with that key already exists.',
    },
  ])('should fail Add Record with $status without exposing the password or logging anything', async ({ status, body, message }) => {
    fetchMock.mockImplementationOnce(async () => Response.json(body, { status }));

    const failure = await (addRecord as Runnable).run({ auth: AUTH, propsValue: { resourceType: 'user', record: USER } }).catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toBe(message);
    expect((failure as Error).cause).toBeUndefined();
    const text = errorText(failure);
    SECRETS.forEach((secret) => expect(text).not.toContain(secret));
    consoleSpies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual(USER);
  });

  it('should fail Update Record with a password change without exposing it or logging anything', async () => {
    fetchMock.mockImplementationOnce(async () =>
      Response.json({ error: { code: 403, status: 'PERMISSION_DENIED', message: 'Not Authorized to access this resource/api', errors: [{ reason: 'forbidden', message: 'Not Authorized to access this resource/api' }] } }, { status: 403 })
    );

    const failure = await (updateRecord as Runnable)
      .run({ auth: AUTH, propsValue: { resourceType: 'user', identifier: 'jane@example.com', record: { password: PASSWORD } } })
      .catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toContain('Google Workspace API returned 403 (PERMISSION_DENIED): forbidden');
    expect(errorText(failure)).not.toContain(PASSWORD);
    consoleSpies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
  });

  it('should still return the created user on success', async () => {
    fetchMock.mockImplementationOnce(async () => Response.json({ id: '1122', primaryEmail: 'jane@example.com' }));

    await expect((addRecord as Runnable).run({ auth: AUTH, propsValue: { resourceType: 'user', record: USER } })).resolves.toEqual({
      resourceType: 'user',
      id: '1122',
      record: { id: '1122', primaryEmail: 'jane@example.com' },
    });
    consoleSpies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
  });
});
