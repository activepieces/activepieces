import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { jsmUsers } from '../src/lib/common/users';

const cloud = { deployment: 'cloud', instanceUrl: 'https://acme.atlassian.net', email: 'agent@acme.test', apiToken: 'tok' };
const dataCenter = { deployment: 'data_center', instanceUrl: 'https://jira.acme.test', apiToken: 'pat' };

afterEach(() => {
	vi.restoreAllMocks();
});

describe('jsmUsers.toList', () => {
	it('accepts arrays, JSON strings, separated strings and empties', () => {
		expect(jsmUsers.toList(['a@x.test', ' b@x.test '])).toEqual(['a@x.test', 'b@x.test']);
		expect(jsmUsers.toList('["a@x.test","b@x.test"]')).toEqual(['a@x.test', 'b@x.test']);
		expect(jsmUsers.toList('a@x.test, b@x.test;c@x.test\nd@x.test')).toEqual(['a@x.test', 'b@x.test', 'c@x.test', 'd@x.test']);
		expect(jsmUsers.toList(undefined)).toEqual([]);
		expect(jsmUsers.toList('')).toEqual([]);
		expect(jsmUsers.toList([10000, '10001'])).toEqual(['10000', '10001']);
	});
});

describe('jsmUsers.flatten', () => {
	it('shows the username on Data Center and hides the deprecated name on Cloud', () => {
		expect(jsmUsers.flatten({ name: 'jdoe', displayName: 'Jane' }).username).toBe('jdoe');
		expect(jsmUsers.flatten({ accountId: 'qm:abc', name: 'qm:abc', displayName: 'Jane' })).toMatchObject({ account_id: 'qm:abc', username: null });
	});
});

describe('jsmUsers.resolveOne', () => {
	it('passes usernames through on Data Center without a lookup', async () => {
		const spy = vi.spyOn(httpClient, 'sendRequest');
		expect(await jsmUsers.resolveOne({ auth: dataCenter, value: ' cust1@example.test ' })).toBe('cust1@example.test');
		expect(spy).not.toHaveBeenCalled();
	});

	it('passes account IDs through on Cloud without a lookup', async () => {
		const spy = vi.spyOn(httpClient, 'sendRequest');
		expect(await jsmUsers.resolveOne({ auth: cloud, value: '5b10ac8d82e05b22cc7d4ef5' })).toBe('5b10ac8d82e05b22cc7d4ef5');
		expect(spy).not.toHaveBeenCalled();
	});

	it('turns an email into the account ID of the exact match on Cloud', async () => {
		vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
			status: 200,
			headers: {},
			body: [
				{ accountId: 'other', emailAddress: 'jane.doe@x.test' },
				{ accountId: 'wanted', emailAddress: 'Jane@x.test' },
			],
		});
		expect(await jsmUsers.resolveOne({ auth: cloud, value: 'jane@x.test' })).toBe('wanted');
	});

	it('explains what to do when no user has that email', async () => {
		vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: [] });
		await expect(jsmUsers.resolveOne({ auth: cloud, value: 'nobody@x.test' })).rejects.toThrow('Create the customer first');
	});
});

describe('jsmUsers.peopleBody', () => {
	it('uses accountIds on Cloud and usernames on Data Center', () => {
		expect(jsmUsers.peopleBody({ auth: cloud, ids: ['a'] })).toEqual({ accountIds: ['a'] });
		expect(jsmUsers.peopleBody({ auth: dataCenter, ids: ['a'] })).toEqual({ usernames: ['a'] });
	});
});
