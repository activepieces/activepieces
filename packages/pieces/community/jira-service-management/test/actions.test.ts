import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, InputPropertyMap, StaticPropsValue, createMockActionContext } from '@activepieces/pieces-framework';
import { answerApprovalAction } from '../src/lib/actions/answer-approval';
import { createCustomerAction } from '../src/lib/actions/create-customer';
import { createOrganizationAction } from '../src/lib/actions/create-organization';
import { findRequestsAction } from '../src/lib/actions/find-requests';
import { transitionRequestAction } from '../src/lib/actions/transition-request';
import { JsmAuthValue } from '../src/lib/auth';

const cloudAuth: JsmAuthValue = {
	type: AppConnectionType.CUSTOM_AUTH,
	props: { instanceUrl: 'https://acme.atlassian.net', email: 'agent@acme.test', apiToken: 'tok' },
};
const dataCenterAuth: JsmAuthValue = { type: AppConnectionType.BASIC_AUTH, username: 'https://jira.acme.test', password: 'pat' };
const CLOUD = 'https://acme.atlassian.net';

function makeContext<Props extends InputPropertyMap>({ propsValue, auth }: { propsValue: StaticPropsValue<Props>; auth: JsmAuthValue }) {
	return { ...createMockActionContext<Props>({ propsValue }), auth };
}

function mockJira(routes: Route[]) {
	return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
		const route = routes.find((candidate) => candidate.method === request.method && request.url.endsWith(candidate.path));
		if (!route) {
			throw new Error(`Unexpected request ${request.method} ${request.url}`);
		}
		return { status: 200, headers: {}, body: route.body };
	});
}

function sent({ spy, method, path }: { spy: ReturnType<typeof mockJira>; method: HttpMethod; path: string }): HttpRequest[] {
	return spy.mock.calls.map(([request]) => request).filter((request) => request.method === method && request.url.endsWith(path));
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('Answer Approval', () => {
	const answered = { id: '7', name: 'Manager approval', finalDecision: 'declined', approvers: [] };

	it('answers the only pending approval when none is picked', async () => {
		const spy = mockJira([
			{
				method: HttpMethod.GET,
				path: '/rest/servicedeskapi/request/SD-1/approval',
				body: { values: [{ id: '6', finalDecision: 'approved' }, { id: '7', finalDecision: 'pending' }], isLastPage: true },
			},
			{ method: HttpMethod.POST, path: '/rest/servicedeskapi/request/SD-1/approval/7', body: answered },
		]);
		const result = await answerApprovalAction.run(
			makeContext<typeof answerApprovalAction.props>({ auth: cloudAuth, propsValue: { requestKey: ' SD-1 ', decision: 'decline', approvalId: undefined } }),
		);
		const posts = sent({ spy, method: HttpMethod.POST, path: '/approval/7' });
		expect(posts).toHaveLength(1);
		expect(posts[0].url).toBe(`${CLOUD}/rest/servicedeskapi/request/SD-1/approval/7`);
		expect(posts[0].body).toEqual({ decision: 'decline' });
		expect(result).toMatchObject({ approval_id: '7', issue_key: 'SD-1', final_decision: 'declined' });
	});

	it('asks which approval to answer when several are pending, and answers none', async () => {
		const spy = mockJira([
			{
				method: HttpMethod.GET,
				path: '/rest/servicedeskapi/request/SD-1/approval',
				body: { values: [{ id: '7', finalDecision: 'pending' }, { id: '8', finalDecision: 'pending' }], isLastPage: true },
			},
		]);
		await expect(
			answerApprovalAction.run(
				makeContext<typeof answerApprovalAction.props>({ auth: cloudAuth, propsValue: { requestKey: 'SD-1', decision: 'approve', approvalId: undefined } }),
			),
		).rejects.toThrow('has 2 pending approvals');
		expect(spy.mock.calls.every(([request]) => request.method === HttpMethod.GET)).toBe(true);
	});

	it('says so when the request is not waiting for approval', async () => {
		mockJira([
			{
				method: HttpMethod.GET,
				path: '/rest/servicedeskapi/request/SD-1/approval',
				body: { values: [{ id: '6', finalDecision: 'approved' }], isLastPage: true },
			},
		]);
		await expect(
			answerApprovalAction.run(
				makeContext<typeof answerApprovalAction.props>({ auth: cloudAuth, propsValue: { requestKey: 'SD-1', decision: 'approve', approvalId: undefined } }),
			),
		).rejects.toThrow('has no pending approval');
	});
});

describe('Transition Request', () => {
	const transitions = {
		transitions: [
			{
				id: '761',
				name: 'Resolve this issue',
				fields: { resolution: { required: true, allowedValues: [{ id: '10000', name: 'Done' }, { id: '10001', name: "Won't Do" }] } },
			},
			{ id: '851', name: 'Escalate' },
		],
	};
	const moved = { issueId: '10042', issueKey: 'SD-1', currentStatus: { status: 'Resolved' }, requestFieldValues: [] };
	const routes = [
		{ method: HttpMethod.GET, path: '/rest/api/3/issue/SD-1/transitions', body: transitions },
		{ method: HttpMethod.POST, path: '/rest/api/3/issue/SD-1/transitions', body: {} },
		{ method: HttpMethod.POST, path: '/rest/servicedeskapi/request/SD-1/comment', body: { id: '1' } },
		{ method: HttpMethod.GET, path: '/rest/servicedeskapi/request/SD-1', body: moved },
	];

	it('sends the transition with its resolution, then the public comment', async () => {
		const spy = mockJira(routes);
		const result = await transitionRequestAction.run(
			makeContext<typeof transitionRequestAction.props>({
				auth: cloudAuth,
				propsValue: { requestKey: 'SD-1', transitionId: '761', resolution: 'done', comment: 'Fixed.' },
			}),
		);
		expect(sent({ spy, method: HttpMethod.POST, path: '/issue/SD-1/transitions' })[0].body).toEqual({
			transition: { id: '761' },
			fields: { resolution: { id: '10000' } },
		});
		expect(sent({ spy, method: HttpMethod.POST, path: '/request/SD-1/comment' })[0].body).toEqual({ body: 'Fixed.', public: true });
		expect(result).toMatchObject({ issue_key: 'SD-1', status: 'Resolved' });
	});

	it('stops before changing anything when the transition needs a resolution and none is given', async () => {
		const spy = mockJira(routes);
		await expect(
			transitionRequestAction.run(
				makeContext<typeof transitionRequestAction.props>({
					auth: cloudAuth,
					propsValue: { requestKey: 'SD-1', transitionId: '761', resolution: undefined, comment: undefined },
				}),
			),
		).rejects.toThrow("needs a resolution. Pick one in the Resolution field. Allowed: Done, Won't Do.");
		expect(sent({ spy, method: HttpMethod.POST, path: '/issue/SD-1/transitions' })).toHaveLength(0);
	});

	it('stops before changing anything when the resolution is not allowed for the transition', async () => {
		const spy = mockJira(routes);
		await expect(
			transitionRequestAction.run(
				makeContext<typeof transitionRequestAction.props>({
					auth: cloudAuth,
					propsValue: { requestKey: 'SD-1', transitionId: '761', resolution: 'Duplicate', comment: undefined },
				}),
			),
		).rejects.toThrow('Resolution "Duplicate" is not allowed');
		expect(sent({ spy, method: HttpMethod.POST, path: '/issue/SD-1/transitions' })).toHaveLength(0);
	});

	it('leaves the resolution out for a transition that takes none, and posts no comment when it is empty', async () => {
		const spy = mockJira(routes);
		await transitionRequestAction.run(
			makeContext<typeof transitionRequestAction.props>({
				auth: cloudAuth,
				propsValue: { requestKey: 'SD-1', transitionId: '851', resolution: 'Done', comment: '  ' },
			}),
		);
		expect(sent({ spy, method: HttpMethod.POST, path: '/issue/SD-1/transitions' })[0].body).toEqual({ transition: { id: '851' } });
		expect(sent({ spy, method: HttpMethod.POST, path: '/request/SD-1/comment' })).toHaveLength(0);
	});

	it('lists what is available when the transition cannot run from the current status', async () => {
		const spy = mockJira(routes);
		await expect(
			transitionRequestAction.run(
				makeContext<typeof transitionRequestAction.props>({
					auth: cloudAuth,
					propsValue: { requestKey: 'SD-1', transitionId: '999', resolution: undefined, comment: undefined },
				}),
			),
		).rejects.toThrow('Available now: Resolve this issue, Escalate.');
		expect(sent({ spy, method: HttpMethod.POST, path: '/issue/SD-1/transitions' })).toHaveLength(0);
	});
});

describe('Find Requests', () => {
	const found = { issueId: '10042', issueKey: 'SD-1', requestFieldValues: [{ fieldId: 'summary', value: 'Printer' }] };

	it('searches one service desk by its project, the text and the open status', async () => {
		const spy = mockJira([
			{ method: HttpMethod.GET, path: '/rest/servicedeskapi/servicedesk/1', body: { id: '1', projectId: '10000' } },
			{ method: HttpMethod.POST, path: '/rest/api/3/search/jql', body: { issues: [{ id: '10042', key: 'SD-1' }] } },
			{ method: HttpMethod.GET, path: '/rest/servicedeskapi/request/10042', body: found },
		]);
		const result = await findRequestsAction.run(
			makeContext<typeof findRequestsAction.props>({
				auth: cloudAuth,
				propsValue: { serviceDeskId: '1', searchTerm: 'printer "broken"', requestStatus: 'open', maxResults: 5 },
			}),
		);
		const search = sent({ spy, method: HttpMethod.POST, path: '/search/jql' })[0];
		expect(search.body).toMatchObject({
			jql: 'project in (10000) AND text ~ "printer broken" AND statusCategory != Done ORDER BY created DESC',
			maxResults: 5,
		});
		expect(result).toHaveLength(1);
		expect(result).toMatchObject([{ issue_key: 'SD-1', summary: 'Printer' }]);
	});

	it('searches every service desk on Data Center when none is picked, with no status filter for All', async () => {
		const spy = mockJira([
			{
				method: HttpMethod.GET,
				path: '/rest/servicedeskapi/servicedesk',
				body: { values: [{ id: '1', projectId: '10000' }, { id: '2', projectId: '10001' }], isLastPage: true },
			},
			{ method: HttpMethod.POST, path: '/rest/api/2/search', body: { issues: [], total: 0 } },
		]);
		const result = await findRequestsAction.run(
			makeContext<typeof findRequestsAction.props>({
				auth: dataCenterAuth,
				propsValue: { serviceDeskId: undefined, searchTerm: undefined, requestStatus: 'all', maxResults: undefined },
			}),
		);
		expect(sent({ spy, method: HttpMethod.POST, path: '/rest/api/2/search' })[0].body).toMatchObject({
			jql: 'project in (10000, 10001) ORDER BY created DESC',
			maxResults: 20,
		});
		expect(result).toEqual([]);
	});

	it('returns nothing without searching when the account sees no service desk', async () => {
		const spy = mockJira([{ method: HttpMethod.GET, path: '/rest/servicedeskapi/servicedesk', body: { values: [], isLastPage: true } }]);
		const result = await findRequestsAction.run(
			makeContext<typeof findRequestsAction.props>({
				auth: cloudAuth,
				propsValue: { serviceDeskId: undefined, searchTerm: 'printer', requestStatus: 'all', maxResults: undefined },
			}),
		);
		expect(result).toEqual([]);
		expect(spy.mock.calls.every(([request]) => request.method === HttpMethod.GET)).toBe(true);
	});
});

describe('Create Customer', () => {
	const propsValue = { email: ' jane@x.test ', fullName: ' Jane Doe ' };

	it('sends displayName on Cloud, with the experimental opt-in', async () => {
		const spy = mockJira([{ method: HttpMethod.POST, path: '/rest/servicedeskapi/customer', body: { accountId: 'qm:1', emailAddress: 'jane@x.test' } }]);
		const result = await createCustomerAction.run(makeContext<typeof createCustomerAction.props>({ auth: cloudAuth, propsValue }));
		const request = spy.mock.calls[0][0];
		expect(request.method).toBe(HttpMethod.POST);
		expect(request.body).toEqual({ email: 'jane@x.test', displayName: 'Jane Doe' });
		expect(request.headers).toMatchObject({ 'X-ExperimentalApi': 'opt-in' });
		expect(result).toMatchObject({ account_id: 'qm:1', username: null, email: 'jane@x.test' });
	});

	it('sends fullName on Data Center', async () => {
		const spy = mockJira([{ method: HttpMethod.POST, path: '/rest/servicedeskapi/customer', body: { name: 'jane', emailAddress: 'jane@x.test' } }]);
		const result = await createCustomerAction.run(makeContext<typeof createCustomerAction.props>({ auth: dataCenterAuth, propsValue }));
		const request = spy.mock.calls[0][0];
		expect(request.method).toBe(HttpMethod.POST);
		expect(request.url).toBe('https://jira.acme.test/rest/servicedeskapi/customer');
		expect(request.body).toEqual({ email: 'jane@x.test', fullName: 'Jane Doe' });
		expect(result).toMatchObject({ account_id: null, username: 'jane' });
	});
});

describe('Create Organization', () => {
	const organization = { method: HttpMethod.POST, path: '/rest/servicedeskapi/organization', body: { id: '4', name: 'Acme Inc.' } };

	it('only creates the organization when no service desk is picked', async () => {
		const spy = mockJira([organization]);
		const result = await createOrganizationAction.run(
			makeContext<typeof createOrganizationAction.props>({ auth: cloudAuth, propsValue: { name: ' Acme Inc. ', serviceDeskId: undefined } }),
		);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy.mock.calls[0][0].method).toBe(HttpMethod.POST);
		expect(spy.mock.calls[0][0].body).toEqual({ name: 'Acme Inc.' });
		expect(result).toEqual({ organization_id: '4', name: 'Acme Inc.', service_desk_id: null });
	});

	it('also adds the new organization to the picked service desk, as a number', async () => {
		const spy = mockJira([organization, { method: HttpMethod.POST, path: '/rest/servicedeskapi/servicedesk/2/organization', body: {} }]);
		const result = await createOrganizationAction.run(
			makeContext<typeof createOrganizationAction.props>({ auth: cloudAuth, propsValue: { name: 'Acme Inc.', serviceDeskId: '2' } }),
		);
		const added = sent({ spy, method: HttpMethod.POST, path: '/servicedesk/2/organization' });
		expect(added).toHaveLength(1);
		expect(added[0].body).toEqual({ organizationId: 4 });
		expect(result).toEqual({ organization_id: '4', name: 'Acme Inc.', service_desk_id: '2' });
	});
});

type Route = {
	method: HttpMethod;
	path: string;
	body: unknown;
};
