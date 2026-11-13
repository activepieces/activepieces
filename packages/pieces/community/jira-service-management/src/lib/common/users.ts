import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';
import { JsmAuthProps, JsmUser, jsmClient } from './client';

export const jsmUsers = {
	flatten,
	toList,
	resolveOne,
	resolveMany,
	peopleBody,
};

function flatten(user: JsmUser | null | undefined): FlatUser {
	return {
		account_id: user?.accountId ?? null,
		username: user?.name ?? null,
		name: user?.displayName ?? null,
		email: user?.emailAddress ?? null,
		active: user?.active ?? null,
		time_zone: user?.timeZone ?? null,
	};
}

function toList(value: unknown): string[] {
	if (isNil(value)) {
		return [];
	}
	if (Array.isArray(value)) {
		return value.flatMap((item) => toList(item));
	}
	if (typeof value === 'number') {
		return [String(value)];
	}
	if (typeof value !== 'string') {
		return [];
	}
	const text = value.trim();
	if (text.startsWith('[')) {
		try {
			return toList(JSON.parse(text));
		} catch {
			return splitList(text);
		}
	}
	return splitList(text);
}

async function resolveOne({ auth, value }: { auth: JsmAuthProps; value: string }): Promise<string> {
	const identifier = value.trim();
	if (!jsmClient.isCloud(auth) || !identifier.includes('@')) {
		return identifier;
	}
	const matches = await jsmClient.request<JsmUser[]>({
		auth,
		api: 'jira',
		method: HttpMethod.GET,
		path: '/user/search',
		query: { query: identifier, maxResults: '20' },
	});
	const users = Array.isArray(matches) ? matches : [];
	const exact = users.find((user) => user.emailAddress?.toLowerCase() === identifier.toLowerCase());
	const chosen = exact ?? (users.length === 1 ? users[0] : undefined);
	if (isNil(chosen?.accountId)) {
		throw new Error(
			`No Jira user was found for "${identifier}". Create the customer first with the Create Customer action, or use their account ID instead of the email.`,
		);
	}
	return chosen.accountId;
}

async function resolveMany({ auth, values }: { auth: JsmAuthProps; values: string[] }): Promise<string[]> {
	const resolved: string[] = [];
	for (const value of values) {
		resolved.push(await resolveOne({ auth, value }));
	}
	return Array.from(new Set(resolved));
}

function peopleBody({ auth, ids }: { auth: JsmAuthProps; ids: string[] }): Record<string, string[]> {
	return jsmClient.isCloud(auth) ? { accountIds: ids } : { usernames: ids };
}

function splitList(text: string): string[] {
	return text
		.split(/[,\n;]/)
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
}

export type FlatUser = {
	account_id: string | null;
	username: string | null;
	name: string | null;
	email: string | null;
	active: boolean | null;
	time_zone: string | null;
};
