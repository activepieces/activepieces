import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { jsmAuth, jsmCloudAuth, jsmConnection, jsmDataCenterAuth } from '../src/lib/auth';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('jsmAuth', () => {
	it('offers two connection types the framework can tell apart', () => {
		expect(jsmAuth.map((auth) => auth.displayName)).toEqual(['Jira Cloud', 'Jira Data Center']);
		expect(new Set(jsmAuth.map((auth) => auth.type)).size).toBe(2);
	});

	it('labels the Data Center fields as URL and token', () => {
		expect(jsmDataCenterAuth.username.displayName).toBe('Instance URL');
		expect(jsmDataCenterAuth.password.displayName).toBe('Personal Access Token');
	});
});

describe('jsmConnection.toProps', () => {
	it('reads a Cloud connection from its fields', () => {
		expect(
			jsmConnection.toProps({
				type: AppConnectionType.CUSTOM_AUTH,
				props: { instanceUrl: 'https://acme.atlassian.net', email: 'agent@acme.test', apiToken: 'tok' },
			}),
		).toEqual({ deployment: 'cloud', instanceUrl: 'https://acme.atlassian.net', email: 'agent@acme.test', apiToken: 'tok' });
	});

	it('reads a Data Center connection from the URL and token slots', () => {
		expect(
			jsmConnection.toProps({ type: AppConnectionType.BASIC_AUTH, username: 'https://jira.acme.test', password: 'pat' }),
		).toEqual({ deployment: 'data_center', instanceUrl: 'https://jira.acme.test', apiToken: 'pat' });
	});
});

describe('connection validation', () => {
	it('rejects a Data Center URL that is not a link, without calling Jira', async () => {
		const spy = vi.spyOn(httpClient, 'sendRequest');
		const result = await jsmDataCenterAuth.validate?.({ auth: { username: 'jira.acme.test', password: 'pat' }, server: { apiUrl: '', publicUrl: '', token: '' } });
		expect(result).toEqual({ valid: false, error: expect.stringContaining('full link') });
		expect(spy).not.toHaveBeenCalled();
	});

	it('checks Data Center with a Bearer token against REST v2 and the service desk API', async () => {
		const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: {} });
		const result = await jsmDataCenterAuth.validate?.({ auth: { username: 'https://jira.acme.test/', password: 'pat' }, server: { apiUrl: '', publicUrl: '', token: '' } });
		expect(result).toEqual({ valid: true });
		expect(spy.mock.calls.map((call) => call[0].url)).toEqual([
			'https://jira.acme.test/rest/api/2/myself',
			'https://jira.acme.test/rest/servicedeskapi/servicedesk',
		]);
		expect(spy.mock.calls[0][0].headers).toMatchObject({ Authorization: 'Bearer pat' });
	});

	it('checks Cloud with Basic email:token against REST v3', async () => {
		const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: {} });
		const result = await jsmCloudAuth.validate?.({
			auth: { instanceUrl: 'https://acme.atlassian.net', email: 'agent@acme.test', apiToken: 'tok' },
			server: { apiUrl: '', publicUrl: '', token: '' },
		});
		expect(result).toEqual({ valid: true });
		expect(spy.mock.calls[0][0].url).toBe('https://acme.atlassian.net/rest/api/3/myself');
		expect(spy.mock.calls[0][0].headers).toMatchObject({
			Authorization: `Basic ${Buffer.from('agent@acme.test:tok').toString('base64')}`,
		});
	});

	it('says so when the login works but the site has no service desk', async () => {
		vi.spyOn(httpClient, 'sendRequest')
			.mockResolvedValueOnce({ status: 200, headers: {}, body: {} })
			.mockRejectedValueOnce(new HttpError({}, { status: 404, responseBody: 'Not Found' }));
		const result = await jsmCloudAuth.validate?.({
			auth: { instanceUrl: 'https://acme.atlassian.net', email: 'agent@acme.test', apiToken: 'tok' },
			server: { apiUrl: '', publicUrl: '', token: '' },
		});
		expect(result).toEqual({ valid: false, error: 'The login works, but Jira Service Management was not found on this site.' });
	});
});
