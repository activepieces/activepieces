import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, httpClient } from '@activepieces/pieces-common';
import { jsmRequests } from '../src/lib/common/requests';

const cloud = { deployment: 'cloud', instanceUrl: 'https://acme.atlassian.net', email: 'agent@acme.test', apiToken: 'tok' };
const dataCenter = { deployment: 'data_center', instanceUrl: 'https://jira.acme.test/', apiToken: 'pat' };

const rawRequest = {
	issueId: '10001',
	issueKey: 'SD-2',
	requestTypeId: '14',
	requestType: { id: '14', name: 'Report a system problem' },
	serviceDeskId: '1',
	createdDate: { iso8601: '2026-11-13T16:29:05+0000' },
	reporter: { name: 'cust1@example.test', emailAddress: 'cust1@example.test', displayName: 'Test Customer' },
	requestFieldValues: [
		{ fieldId: 'summary', label: 'Summary', value: 'Laptop will not boot' },
		{ fieldId: 'description', label: 'Description', value: 'Black screen.' },
		{ fieldId: 'priority', label: 'Urgency', value: { id: '2', name: 'High' } },
		{ fieldId: 'components', label: 'System', value: [{ id: '1', name: 'Active Directory' }, { id: '2', name: 'VPN' }] },
		{ fieldId: 'customfield_1', label: 'Impact', value: { id: '9', value: 'Hardware', child: { id: '10', value: 'Laptop' } } },
		{ fieldId: 'attachment', label: 'Attachment', value: [] },
	],
	currentStatus: { status: 'Waiting for support', statusCategory: 'NEW', statusDate: { iso8601: '2026-11-13T16:29:05+0000' } },
	_links: { web: 'https://jira.acme.test/servicedesk/customer/portal/1/SD-2' },
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe('jsmRequests.flatten', () => {
	it('returns one flat, readable record', () => {
		expect(jsmRequests.flatten({ auth: dataCenter, request: rawRequest })).toEqual({
			issue_id: '10001',
			issue_key: 'SD-2',
			summary: 'Laptop will not boot',
			description: 'Black screen.',
			status: 'Waiting for support',
			status_category: 'NEW',
			status_changed_at: '2026-11-13T16:29:05+0000',
			request_type_id: '14',
			request_type_name: 'Report a system problem',
			service_desk_id: '1',
			created_at: '2026-11-13T16:29:05+0000',
			reporter_account_id: null,
			reporter_username: 'cust1@example.test',
			reporter_name: 'Test Customer',
			reporter_email: 'cust1@example.test',
			portal_url: 'https://jira.acme.test/servicedesk/customer/portal/1/SD-2',
			agent_url: 'https://jira.acme.test/browse/SD-2',
			fields: {
				summary: 'Laptop will not boot',
				description: 'Black screen.',
				priority: 'High',
				components: ['Active Directory', 'VPN'],
				customfield_1: 'Hardware > Laptop',
				attachment: [],
			},
		});
	});

	it('adds status history, participants and SLAs only when Jira returned them', () => {
		const flat = jsmRequests.flatten({
			auth: cloud,
			request: {
				...rawRequest,
				status: { values: [{ status: 'Open', statusCategory: 'NEW', statusDate: { iso8601: '2026-11-13T16:00:00+0000' } }] },
				participants: { values: [{ accountId: 'abc', displayName: 'Pat', emailAddress: 'pat@x.test', active: true, timeZone: 'UTC' }] },
				sla: {
					values: [
						{
							id: '2',
							name: 'Time to first response',
							completedCycles: [{}],
							ongoingCycle: {
								breached: false,
								paused: false,
								startTime: { iso8601: '2026-11-13T16:00:00+0000' },
								breachTime: { iso8601: '2026-11-13T20:00:00+0000' },
								goalDuration: { millis: 14400000, friendly: '4h' },
								elapsedTime: { millis: 3600000, friendly: '1h' },
								remainingTime: { millis: 10800000, friendly: '3h' },
							},
						},
					],
				},
			},
		});
		expect(flat.status_history).toEqual([{ status: 'Open', status_category: 'NEW', changed_at: '2026-11-13T16:00:00+0000' }]);
		expect(flat.participants).toEqual([{ account_id: 'abc', username: null, name: 'Pat', email: 'pat@x.test', active: true, time_zone: 'UTC' }]);
		expect(flat.slas).toEqual([
			{
				id: '2',
				name: 'Time to first response',
				ongoing: true,
				breached: false,
				paused: false,
				started_at: '2026-11-13T16:00:00+0000',
				breach_at: '2026-11-13T20:00:00+0000',
				goal: '4h',
				elapsed: '1h',
				remaining: '3h',
				remaining_millis: 10800000,
				completed_cycles: 1,
			},
		]);
		expect(jsmRequests.flatten({ auth: cloud, request: rawRequest })).not.toHaveProperty('slas');
	});
});

describe('jsmRequests.fetchMany', () => {
	it('falls back to the Jira issue when the issue is not a customer request', async () => {
		vi.spyOn(httpClient, 'sendRequest')
			.mockResolvedValueOnce({ status: 200, headers: {}, body: rawRequest })
			.mockRejectedValueOnce(new HttpError({}, { status: 404, responseBody: { errorMessage: 'Not a request' } }));
		const requests = await jsmRequests.fetchMany({
			auth: dataCenter,
			issues: [
				{ id: '10001', key: 'SD-2' },
				{ id: '10009', key: 'SD-9', fields: { summary: 'Internal task', created: '2026-11-13T17:00:00.000+0000', status: { name: 'Open', statusCategory: { key: 'new' } } } },
			],
		});
		expect(requests.map((request) => request.issue_key)).toEqual(['SD-2', 'SD-9']);
		expect(requests[1]).toMatchObject({ summary: 'Internal task', status: 'Open', status_category: 'NEW', request_type_id: null, agent_url: 'https://jira.acme.test/browse/SD-9' });
		expect(Object.keys(requests[1])).toEqual(Object.keys(requests[0]));
	});

	it('rethrows errors that are not "not found"', async () => {
		vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 403, responseBody: { errorMessage: 'Forbidden' } }));
		await expect(jsmRequests.fetchMany({ auth: dataCenter, issues: [{ id: '1', key: 'SD-1' }] })).rejects.toThrow('(403)');
	});
});

describe('jsmRequests.textClause', () => {
	it('removes the characters that break a Jira text search', () => {
		expect(jsmRequests.textClause('(printer')).toBe('text ~ "printer"');
		expect(jsmRequests.textClause('wi-fi [down] "now"')).toBe('text ~ "wi fi down now"');
	});

	it('returns nothing when only special characters were typed', () => {
		expect(jsmRequests.textClause(' ([~]) ')).toBeNull();
	});
});

describe('jsmRequests.quoteJql', () => {
	it('escapes quotes and backslashes', () => {
		expect(jsmRequests.quoteJql('say "hi" \\ bye')).toBe('"say \\"hi\\" \\\\ bye"');
	});
});
