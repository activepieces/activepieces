import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';
import { JsmAuthProps, JsmUser, jsmClient } from './client';

export const jsmUsers = {
	flatten,
	usernameOf,
	toList,
	resolveOne,
	resolveMany,
	peopleBody,
};

function flatten(user: JsmUser | null | undefined): FlatUser {
	return {
		account_id: user?.accountId ?? null,
		username: usernameOf(user),
		name: user?.displayName ?? null,
		email: user?.emailAddress ?? null,
		active: user?.active ?? null,
		time_zone: user?.timeZone ?? null,
	};
}

function usernameOf(user: JsmUser | null | undefined): string | null {
	return isNil(user?.accountId) ? user?.name ?? null : null;
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

async function resolveOne({ auth, value, lookup }: { auth: JsmAuthProps; value: string; lookup?: LookupOptions }): Promise<string> {
	const identifier = value.trim();
	if (!jsmClient.isCloud(auth) || !identifier.includes('@')) {
		return identifier;
	}
	const attempts = lookup?.attempts ?? LOOKUP_ATTEMPTS;
	const delayMs = lookup?.delayMs ?? LOOKUP_DELAY_MS;
	for (let attempt = 0; attempt < attempts; attempt++) {
		const accountId = await findAccountIdByEmail({ auth, email: identifier });
		if (!isNil(accountId)) {
			return accountId;
		}
		if (attempt < attempts - 1) {
			await wait(delayMs);
		}
	}
	throw new Error(
		`No Jira user was found for "${identifier}". Jira may hide this person's email from the connected account, and a customer created less than a minute ago may not be searchable yet: use the Account ID from the Create Customer step instead of the email.`,
	);
}

async function resolveMany({ auth, values, lookup }: { auth: JsmAuthProps; values: string[]; lookup?: LookupOptions }): Promise<string[]> {
	const resolved: string[] = [];
	for (const value of values) {
		resolved.push(await resolveOne({ auth, value, lookup }));
	}
	return Array.from(new Set(resolved));
}

function peopleBody({ auth, ids }: { auth: JsmAuthProps; ids: string[] }): Record<string, string[]> {
	return jsmClient.isCloud(auth) ? { accountIds: ids } : { usernames: ids };
}

async function findAccountIdByEmail({ auth, email }: { auth: JsmAuthProps; email: string }): Promise<string | undefined> {
	const matches = await jsmClient.request<JsmUser[]>({
		auth,
		api: 'jira',
		method: HttpMethod.GET,
		path: '/user/search',
		query: { query: email, maxResults: '50' },
	});
	const users = Array.isArray(matches) ? matches : [];
	return users.find((user) => user.emailAddress?.toLowerCase() === email.toLowerCase())?.accountId;
}

async function wait(ms: number): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

function splitList(text: string): string[] {
	return text
		.split(/[,\n;]/)
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
}

const LOOKUP_ATTEMPTS = 13;
const LOOKUP_DELAY_MS = 5000;

export type FlatUser = {
	account_id: string | null;
	username: string | null;
	name: string | null;
	email: string | null;
	active: boolean | null;
	time_zone: string | null;
};

export type LookupOptions = {
	attempts: number;
	delayMs: number;
};
