import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { JsmApiError, jsmClient } from '../src/lib/common/client';

const cloud = { deployment: 'cloud', instanceUrl: 'https://acme.atlassian.net/', email: 'agent@acme.test', apiToken: 'tok' };
const dataCenter = { deployment: 'data_center', instanceUrl: 'https://jira.acme.test', apiToken: 'pat' };

function ok(body: unknown) {
	return { status: 200, headers: {}, body };
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('jsmClient.authHeaders', () => {
	it('uses Basic email:token on Cloud', () => {
		expect(jsmClient.authHeaders(cloud)).toEqual({
			Authorization: `Basic ${Buffer.from('agent@acme.test:tok').toString('base64')}`,
		});
	});

	it('uses Bearer token on Data Center', () => {
		expect(jsmClient.authHeaders(dataCenter)).toEqual({ Authorization: 'Bearer pat' });
	});
});

describe('jsmClient.instanceUrl', () => {
	it('keeps only the site address when a Cloud user pastes a page link', () => {
		expect(jsmClient.instanceUrl({ ...cloud, instanceUrl: 'https://acme.atlassian.net/jira/servicedesk/projects/SD/queues' })).toBe(
			'https://acme.atlassian.net',
		);
	});

	it('keeps a context path on Data Center', () => {
		expect(jsmClient.instanceUrl({ ...dataCenter, instanceUrl: 'https://intranet.acme.test/jira/' })).toBe('https://intranet.acme.test/jira');
	});
});

describe('jsmClient.request', () => {
	it('targets servicedeskapi and trims the trailing slash of the instance URL', async () => {
		const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ id: '1' }));
		await jsmClient.request({ auth: cloud, api: 'servicedesk', method: HttpMethod.GET, path: '/request/SD-1', query: { expand: 'sla', skip: undefined } });
		const sent = spy.mock.calls[0][0];
		expect(sent.url).toBe('https://acme.atlassian.net/rest/servicedeskapi/request/SD-1');
		expect(sent.queryParams).toEqual({ expand: 'sla' });
	});

	it('uses Jira REST v3 on Cloud and v2 on Data Center', async () => {
		const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({}));
		await jsmClient.request({ auth: cloud, api: 'jira', method: HttpMethod.GET, path: '/myself' });
		await jsmClient.request({ auth: dataCenter, api: 'jira', method: HttpMethod.GET, path: '/myself' });
		expect(spy.mock.calls[0][0].url).toBe('https://acme.atlassian.net/rest/api/3/myself');
		expect(spy.mock.calls[1][0].url).toBe('https://jira.acme.test/rest/api/2/myself');
	});

	it('adds the experimental opt-in header only when asked', async () => {
		const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({}));
		await jsmClient.request({ auth: dataCenter, api: 'servicedesk', method: HttpMethod.POST, path: '/customer', body: {}, experimental: true });
		await jsmClient.request({ auth: dataCenter, api: 'servicedesk', method: HttpMethod.GET, path: '/info' });
		expect(spy.mock.calls[0][0].headers).toMatchObject({ 'X-ExperimentalApi': 'opt-in' });
		expect(spy.mock.calls[1][0].headers).not.toHaveProperty('X-ExperimentalApi');
	});

	it('surfaces the service desk error message with the status', async () => {
		vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 404, responseBody: { errorMessage: 'Cannot find issue' } }));
		const failure = await jsmClient.request({ auth: cloud, api: 'servicedesk', method: HttpMethod.GET, path: '/request/SD-9' }).catch((error) => error);
		expect(failure).toBeInstanceOf(JsmApiError);
		expect(failure.status).toBe(404);
		expect(failure.message).toContain('(404)');
		expect(failure.message).toContain('Cannot find issue');
	});

	it('joins Jira REST errorMessages and per-field errors', async () => {
		vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
			new HttpError({}, { status: 400, responseBody: { errorMessages: ['Bad JQL.'], errors: { resolution: 'Resolution is required.' } } }),
		);
		const failure = await jsmClient.request({ auth: cloud, api: 'jira', method: HttpMethod.POST, path: '/search/jql' }).catch((error) => error);
		expect(failure.message).toContain('Bad JQL.');
		expect(failure.message).toContain('resolution: Resolution is required.');
	});

	it('does not leak an HTML error page into the message', async () => {
		vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 401, responseBody: '<html><body>Unauthorized</body></html>' }));
		const failure = await jsmClient.request({ auth: cloud, api: 'jira', method: HttpMethod.GET, path: '/myself' }).catch((error) => error);
		expect(failure.message).not.toContain('<html>');
		expect(failure.message).toContain('Check the Instance URL, email and token');
	});
});

describe('jsmClient.paginate', () => {
	it('follows pages until isLastPage and passes start offsets', async () => {
		const spy = vi
			.spyOn(httpClient, 'sendRequest')
			.mockResolvedValueOnce(ok({ values: [{ id: '1' }, { id: '2' }], isLastPage: false }))
			.mockResolvedValueOnce(ok({ values: [{ id: '3' }], isLastPage: true }));
		const items = await jsmClient.paginate<{ id: string }>({ auth: cloud, path: '/servicedesk', limit: 200 });
		expect(items.map((item) => item.id)).toEqual(['1', '2', '3']);
		expect(spy.mock.calls[1][0].queryParams).toMatchObject({ start: '2' });
	});

	it('stops at the limit', async () => {
		const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ values: [{ id: 'a' }, { id: 'b' }], isLastPage: false }));
		const items = await jsmClient.paginate<{ id: string }>({ auth: cloud, path: '/x', limit: 3 });
		expect(items).toHaveLength(3);
		expect(spy).toHaveBeenCalledTimes(2);
		expect(spy.mock.calls[1][0].queryParams).toMatchObject({ limit: '1' });
	});
});

describe('jsmClient.searchIssues', () => {
	it('pages Cloud search with nextPageToken', async () => {
		const spy = vi
			.spyOn(httpClient, 'sendRequest')
			.mockResolvedValueOnce(ok({ issues: [{ id: '1', key: 'SD-1' }], nextPageToken: 'next' }))
			.mockResolvedValueOnce(ok({ issues: [{ id: '2', key: 'SD-2' }] }));
		const result = await jsmClient.searchIssues({ auth: cloud, jql: 'project = 1', limit: 10, fields: ['summary'] });
		expect(result.issues.map((issue) => issue.key)).toEqual(['SD-1', 'SD-2']);
		expect(result.truncated).toBe(false);
		expect(spy.mock.calls[0][0].url).toBe('https://acme.atlassian.net/rest/api/3/search/jql');
		expect(spy.mock.calls[1][0].body).toMatchObject({ nextPageToken: 'next' });
	});

	it('reports truncated when Cloud has more pages than the limit', async () => {
		vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ issues: [{ id: '1', key: 'SD-1' }], nextPageToken: 'more' }));
		const result = await jsmClient.searchIssues({ auth: cloud, jql: 'x', limit: 1, fields: [] });
		expect(result).toEqual({ issues: [{ id: '1', key: 'SD-1' }], truncated: true });
	});

	it('pages Data Center search with startAt and total', async () => {
		const spy = vi
			.spyOn(httpClient, 'sendRequest')
			.mockResolvedValueOnce(ok({ issues: [{ id: '1', key: 'SD-1' }], total: 2 }))
			.mockResolvedValueOnce(ok({ issues: [{ id: '2', key: 'SD-2' }], total: 2 }));
		const result = await jsmClient.searchIssues({ auth: dataCenter, jql: 'project = 1', limit: 10, fields: ['summary'] });
		expect(result).toEqual({ issues: [{ id: '1', key: 'SD-1' }, { id: '2', key: 'SD-2' }], truncated: false });
		expect(spy.mock.calls[0][0].url).toBe('https://jira.acme.test/rest/api/2/search');
		expect(spy.mock.calls[1][0].body).toMatchObject({ startAt: 1 });
	});

	it('reports truncated when Data Center total exceeds the limit', async () => {
		vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ issues: [{ id: '1', key: 'SD-1' }], total: 9 }));
		const result = await jsmClient.searchIssues({ auth: dataCenter, jql: 'x', limit: 1, fields: [] });
		expect(result.truncated).toBe(true);
		expect(result.issues).toHaveLength(1);
	});
});
