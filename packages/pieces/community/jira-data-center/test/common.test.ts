import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, InputPropertyMap, StaticPropsValue, createMockActionContext } from '@activepieces/pieces-framework';
import { JiraDataCenterAuth } from '../src/auth';
import { getIssueAction } from '../src/lib/actions/get-issue';
import { transitionIssueAction } from '../src/lib/actions/transition-issue';
import { jiraBaseUrl, jiraToken } from '../src/lib/common';
import { jiraCommentProps } from '../src/lib/common/comment-props';
import { jiraTransitions } from '../src/lib/common/transitions';

const auth: JiraDataCenterAuth = {
	type: AppConnectionType.CUSTOM_AUTH,
	props: { instanceUrl: 'https://jira.acme.test', personalAccessToken: 'pat' },
};

function authWith(props: Partial<JiraDataCenterAuth['props']>): JiraDataCenterAuth {
	return { ...auth, props: { ...auth.props, ...props } };
}

function makeContext<Props extends InputPropertyMap>({ propsValue }: { propsValue: StaticPropsValue<Props> }) {
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

const TRANSITIONS = {
	transitions: [
		{ id: '11', name: 'Start Progress', fields: {} },
		{
			id: '21',
			name: 'Resolve Issue',
			fields: { resolution: { required: true, allowedValues: [{ id: '1', name: 'Done' }, { id: '2', name: "Won't Do" }] } },
		},
	],
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe('connection values', () => {
	it('drops trailing slashes and spaces from the instance URL, so the API path has one slash', () => {
		expect(jiraBaseUrl(authWith({ instanceUrl: ' https://jira.acme.test/jira// ' }))).toBe('https://jira.acme.test/jira/rest/api/2');
	});

	it('drops spaces pasted around the token', () => {
		expect(jiraToken(authWith({ personalAccessToken: ' pat\n' }))).toBe('pat');
	});
});

describe('comment picker label', () => {
	it('shows the author and the text on one line, cut at 80 characters, with the id', () => {
		const label = jiraCommentProps.toOptionLabel({ comment: { id: '10200', body: `first line\nsecond ${'x'.repeat(100)}`, author: { displayName: 'Admin' } } });
		expect(label.startsWith('Admin: first line second xxx')).toBe(true);
		expect(label.endsWith('… (10200)')).toBe(true);
	});

	it('falls back to the id when the comment has no text or author', () => {
		expect(jiraCommentProps.toOptionLabel({ comment: { id: '10200' } })).toBe('10200');
	});
});

describe('Get Issue', () => {
	it('asks Jira for transitions when Map Transition Names is on, and keys them by name', async () => {
		const spy = mockJira([{ method: HttpMethod.GET, path: '/rest/api/2/issue/10001', body: { id: '10001', fields: {}, transitions: [{ id: '11', name: 'Start Progress' }] } }]);

		const result = await getIssueAction.run(
			makeContext<typeof getIssueAction.props>({ propsValue: { projectId: 'SD', issueId: '10001', expand: undefined, mapNames: false, mapTransitions: true } }),
		);

		expect(spy.mock.calls[0][0].queryParams).toEqual({ expand: 'transitions' });
		expect(result).toMatchObject({ transitions: { 'Start Progress': { id: '11' } } });
	});

	it('sends no expand when nothing extra is asked for', async () => {
		const spy = mockJira([{ method: HttpMethod.GET, path: '/rest/api/2/issue/10001', body: { id: '10001', fields: {} } }]);

		await getIssueAction.run(
			makeContext<typeof getIssueAction.props>({ propsValue: { projectId: 'SD', issueId: '10001', expand: undefined, mapNames: false, mapTransitions: false } }),
		);

		expect(spy.mock.calls[0][0].queryParams).toEqual({});
	});
});

describe('Transition Issue', () => {
	const issue = { id: '10001', key: 'SD-1', fields: { status: { name: 'Resolved' } } };

	it('sends the resolution with a transition that needs one, then returns the issue', async () => {
		const spy = mockJira([
			{ method: HttpMethod.GET, path: '/issue/10001/transitions', body: TRANSITIONS },
			{ method: HttpMethod.POST, path: '/issue/10001/transitions', body: '' },
			{ method: HttpMethod.GET, path: '/issue/10001', body: issue },
		]);

		const result = await transitionIssueAction.run(
			makeContext<typeof transitionIssueAction.props>({ propsValue: { projectId: 'SD', issueId: '10001', transitionId: 'resolve issue', resolution: 'done', comment: undefined } }),
		);

		expect(sent({ spy, method: HttpMethod.POST, path: '/transitions' })[0].body).toEqual({ transition: { id: '21' }, fields: { resolution: { id: '1' } } });
		expect(sent({ spy, method: HttpMethod.POST, path: '/comment' })).toHaveLength(0);
		expect(result).toEqual(issue);
	});

	it('adds the comment after the move', async () => {
		const spy = mockJira([
			{ method: HttpMethod.GET, path: '/issue/10001/transitions', body: TRANSITIONS },
			{ method: HttpMethod.POST, path: '/issue/10001/transitions', body: '' },
			{ method: HttpMethod.POST, path: '/issue/10001/comment', body: { id: '1' } },
			{ method: HttpMethod.GET, path: '/issue/10001', body: issue },
		]);

		await transitionIssueAction.run(
			makeContext<typeof transitionIssueAction.props>({ propsValue: { projectId: 'SD', issueId: '10001', transitionId: '11', resolution: undefined, comment: ' Working on it ' } }),
		);

		expect(sent({ spy, method: HttpMethod.POST, path: '/transitions' })[0].body).toEqual({ transition: { id: '11' } });
		expect(sent({ spy, method: HttpMethod.POST, path: '/comment' })[0].body).toEqual({ body: 'Working on it' });
	});

	it('names the allowed resolutions and moves nothing when a needed resolution is missing', async () => {
		const spy = mockJira([{ method: HttpMethod.GET, path: '/issue/10001/transitions', body: TRANSITIONS }]);

		await expect(
			transitionIssueAction.run(
				makeContext<typeof transitionIssueAction.props>({ propsValue: { projectId: 'SD', issueId: '10001', transitionId: '21', resolution: undefined, comment: undefined } }),
			),
		).rejects.toThrow('needs a resolution. Pick one in the Resolution field. Allowed: Done, Won\'t Do.');
		expect(spy.mock.calls.every(([request]) => request.method === HttpMethod.GET)).toBe(true);
	});
});

describe('jiraTransitions.resolve', () => {
	it('lists what is available when the transition cannot run from the current status', () => {
		expect(() =>
			jiraTransitions.resolve({ transitions: TRANSITIONS.transitions, transitionIdOrName: 'Close', resolutionIdOrName: undefined, issueId: 'SD-1' }),
		).toThrow('Transition "Close" is not available for issue SD-1 in its current status. Available now: Start Progress, Resolve Issue.');
	});

	it('rejects a resolution the transition does not allow', () => {
		expect(() =>
			jiraTransitions.resolve({ transitions: TRANSITIONS.transitions, transitionIdOrName: '21', resolutionIdOrName: 'Duplicate', issueId: 'SD-1' }),
		).toThrow('Resolution "Duplicate" is not allowed for transition "Resolve Issue". Allowed: Done, Won\'t Do.');
	});

	it('ignores a leftover resolution on a transition that takes none', () => {
		expect(
			jiraTransitions.resolve({ transitions: TRANSITIONS.transitions, transitionIdOrName: '11', resolutionIdOrName: '1', issueId: 'SD-1' }).resolution,
		).toBeUndefined();
	});
});

type Route = { method: HttpMethod; path: string; body: unknown };
