import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSdk, oauthAuth, customAuth, resetSnowflake, respond, state } from './helpers';

vi.mock('snowflake-sdk', async () => (await import('./helpers')).fakeSdk);

import { withSnowflake, clampTimeout } from '../src/lib/common/client';
import { snowflakeCustomAuth, snowflakeOAuth2Auth } from '../src/lib/auth';

beforeEach(() => resetSnowflake());

describe('client', () => {
  it('loading the piece does not create connections', async () => {
    await import('../src');
    expect(fakeSdk.createConnection).not.toHaveBeenCalled();
  });

  it('sets a statement timeout and caps rows', async () => {
    respond({ match: /SELECT/, rows: [{ A: 1 }, { A: 2 }, { A: 3 }] });
    const result = await withSnowflake({
      auth: customAuth,
      statementTimeoutSeconds: 30,
      fn: (session) => session.query({ sql: 'SELECT A FROM T', maxRows: 2 }),
    });
    expect(state.calls[0].sql).toBe('ALTER SESSION SET STATEMENT_TIMEOUT_IN_SECONDS = 30');
    expect(result).toMatchObject({ rows: [{ A: 1 }, { A: 2 }], totalRows: 3, truncated: true, columns: ['A'] });
    expect(fakeSdk.configure).toHaveBeenCalledWith({ logLevel: 'ERROR' });
  });

  it('clamps timeouts to the step limit', () => {
    expect(clampTimeout(9999)).toBe(540);
    expect(clampTimeout(0.2)).toBe(1);
    expect(clampTimeout(undefined)).toBe(540);
  });

  it('builds OAuth options from the connection', async () => {
    await withSnowflake({ auth: oauthAuth, fn: async () => null });
    expect(state.lastOptions).toMatchObject({ account: 'org-acct', authenticator: 'OAUTH', token: 'token-123', role: 'AP_ROLE' });
  });

  it('uses key-pair auth when a private key is set', async () => {
    await withSnowflake({
      auth: { ...customAuth, props: { ...customAuth.props, privateKey: 'A'.repeat(70), privateKeyPassphrase: 'pp' } },
      fn: async () => null,
    });
    expect(state.lastOptions).toMatchObject({ authenticator: 'SNOWFLAKE_JWT', privateKeyPass: 'pp' });
    expect(String(state.lastOptions?.['privateKey'])).toContain('-----BEGIN PRIVATE KEY-----\n');
    expect(state.lastOptions?.['password']).toBeUndefined();
  });

  it('maps known login error codes to a clear message', async () => {
    state.connectError = Object.assign(new Error('Incorrect username or password was specified.'), { code: '390100' });
    await expect(withSnowflake({ auth: customAuth, fn: async () => null })).rejects.toThrow('rejected the username or password');
  });

  it('points to the account identifier when the host cannot be reached', async () => {
    state.connectError = Object.assign(new Error('Request to Snowflake failed.'), { code: 401002 });
    await expect(withSnowflake({ auth: customAuth, fn: async () => null })).rejects.toThrow('orgname-accountname');
    state.connectError = Object.assign(new Error('Network error. Could not reach Snowflake.'), { code: 401001 });
    await expect(withSnowflake({ auth: customAuth, fn: async () => null })).rejects.toThrow('Account Identifier looks wrong');
  });

  it('validates custom auth and reports missing credentials', async () => {
    const validate = snowflakeCustomAuth.validate;
    if (!validate) throw new Error('no validate');
    await expect(Reflect.apply(validate, undefined, [{ auth: { account: 'a', username: 'u' }, server: {} }])).resolves.toMatchObject({ valid: false });
    await expect(Reflect.apply(validate, undefined, [{ auth: { account: 'a', username: 'u', password: 'p' }, server: {} }])).resolves.toEqual({ valid: true });
    state.connectError = Object.assign(new Error('JWT token is invalid.'), { code: '390144' });
    await expect(Reflect.apply(validate, undefined, [{ auth: { account: 'a', username: 'u', privateKey: 'A'.repeat(64) }, server: {} }])).resolves.toMatchObject({
      valid: false,
      error: expect.stringContaining('key-pair'),
    });
  });

  it('validates OAuth auth', async () => {
    const validate = snowflakeOAuth2Auth.validate;
    if (!validate) throw new Error('no validate');
    await expect(Reflect.apply(validate, undefined, [{ auth: { access_token: 't', props: { account: 'a' } }, server: {} }])).resolves.toEqual({ valid: true });
    expect(state.lastOptions).toMatchObject({ authenticator: 'OAUTH', token: 't' });
  });
});
