import { HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionType, AppConnectionValueForAuthProperty, PieceAuth, Property, isNil } from '@activepieces/pieces-framework';
import { JSM_DEPLOYMENT, JsmApiError, JsmAuthProps, JsmUser, jsmClient } from './common/client';

export const jsmCloudAuth = PieceAuth.CustomAuth({
	displayName: 'Jira Cloud',
	description: `
Use this when your Jira site ends with \`atlassian.net\`.

1. Open ***https://id.atlassian.com/manage-profile/security/api-tokens*** and click **Create API token**.
2. Fill in your site URL, the email you log in with, and the token.

Connect an account that is an agent or admin of the service desk.
`,
	required: true,
	props: {
		instanceUrl: Property.ShortText({
			displayName: 'Instance URL',
			description: 'For example https://example.atlassian.net',
			required: true,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'The email you use to log in to Jira.',
			required: true,
		}),
		apiToken: PieceAuth.SecretText({
			displayName: 'API Token',
			description: 'Your Jira API token.',
			required: true,
		}),
	},
	validate: async ({ auth }) => checkConnection(cloudProps(auth)),
	getConnectionIdentifier: async ({ auth }) => describeConnection(cloudProps(auth)),
});

export const jsmDataCenterAuth = PieceAuth.BasicAuth({
	displayName: 'Jira Data Center',
	description: `
Use this when Jira is hosted by your company.

1. In Jira, click your **profile picture** (top right) → **Profile** → **Personal Access Tokens** → **Create token**.
2. Fill in your Jira URL and the token.

Connect an account that is an agent or admin of the service desk.
`,
	required: true,
	username: {
		displayName: 'Instance URL',
		description: 'For example https://jira.yourcompany.com',
	},
	password: {
		displayName: 'Personal Access Token',
		description: 'Your Jira personal access token.',
	},
	validate: async ({ auth }) => checkConnection(dataCenterProps(auth)),
	getConnectionIdentifier: async ({ auth }) => describeConnection(dataCenterProps(auth)),
});

export const jsmAuth = [jsmCloudAuth, jsmDataCenterAuth];

export const jsmConnection = {
	toProps,
};

function toProps(auth: JsmAuthValue): JsmAuthProps {
	return auth.type === AppConnectionType.BASIC_AUTH ? dataCenterProps(auth) : cloudProps(auth.props);
}

function cloudProps({ instanceUrl, email, apiToken }: { instanceUrl: string; email: string; apiToken: string }): JsmAuthProps {
	return { deployment: JSM_DEPLOYMENT.CLOUD, instanceUrl, email, apiToken };
}

function dataCenterProps({ username, password }: { username: string; password: string }): JsmAuthProps {
	return { deployment: JSM_DEPLOYMENT.DATA_CENTER, instanceUrl: username, apiToken: password };
}

async function checkConnection(auth: JsmAuthProps): Promise<{ valid: true } | { valid: false; error: string }> {
	if (!isValidUrl(auth.instanceUrl)) {
		return { valid: false, error: 'Instance URL must be a full link, for example https://example.atlassian.net' };
	}
	try {
		await jsmClient.request<JsmUser>({ auth, api: 'jira', method: HttpMethod.GET, path: '/myself' });
	} catch (error) {
		return { valid: false, error: error instanceof Error ? error.message : 'Invalid credentials' };
	}
	try {
		await jsmClient.request<unknown>({ auth, api: 'servicedesk', method: HttpMethod.GET, path: '/info' });
		return { valid: true };
	} catch (error) {
		return { valid: false, error: describeServiceDeskFailure(error) };
	}
}

async function describeConnection(auth: JsmAuthProps): Promise<string | undefined> {
	try {
		const user = await jsmClient.request<JsmUser>({ auth, api: 'jira', method: HttpMethod.GET, path: '/myself' });
		const who = user.emailAddress ?? user.displayName ?? user.name;
		const host = new URL(jsmClient.instanceUrl(auth)).host;
		return isNil(who) ? host : `${who} (${host})`;
	} catch {
		return undefined;
	}
}

function describeServiceDeskFailure(error: unknown): string {
	if (error instanceof JsmApiError && error.status === 404) {
		return 'The login works, but Jira Service Management was not found on this site.';
	}
	return error instanceof Error ? error.message : 'Could not reach Jira Service Management on this site.';
}

function isValidUrl(value: string): boolean {
	try {
		const url = new URL(value.trim());
		return url.protocol === 'https:' || url.protocol === 'http:';
	} catch {
		return false;
	}
}

export type JsmAuthValue = AppConnectionValueForAuthProperty<typeof jsmAuth>;
