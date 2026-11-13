import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property, isNil } from '@activepieces/pieces-framework';
import { JSM_DEPLOYMENT, JsmApiError, JsmAuthProps, JsmUser, jsmClient } from './common/client';

export const jsmAuth = PieceAuth.CustomAuth({
	description: `
**Jira Cloud** (your site ends with \`atlassian.net\`):
1. Open ***https://id.atlassian.com/manage-profile/security/api-tokens*** and click **Create API token**.
2. Fill in your site URL, the email you log in with, and the token.

**Jira Data Center** (Jira hosted by your company):
1. In Jira, click your **profile picture** (top right) → **Profile** → **Personal Access Tokens** → **Create token**.
2. Fill in your Jira URL and the token. Leave **Email** empty.

Connect an account that is an agent or admin of the service desk.
`,
	required: true,
	props: {
		deployment: Property.StaticDropdown({
			displayName: 'Jira Type',
			description: 'Cloud sites end with atlassian.net. Data Center is hosted by your company.',
			required: true,
			defaultValue: JSM_DEPLOYMENT.CLOUD,
			options: {
				options: [
					{ label: 'Jira Cloud', value: JSM_DEPLOYMENT.CLOUD },
					{ label: 'Jira Data Center', value: JSM_DEPLOYMENT.DATA_CENTER },
				],
			},
		}),
		instanceUrl: Property.ShortText({
			displayName: 'Instance URL',
			description: 'The link of your Jira site, for example https://example.atlassian.net or https://jira.yourcompany.com',
			required: true,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Jira Cloud only: the email you use to log in to Jira. Leave empty for Data Center.',
			required: false,
		}),
		apiToken: PieceAuth.SecretText({
			displayName: 'API Token',
			description: 'Jira Cloud: your API token. Data Center: your personal access token.',
			required: true,
		}),
	},
	validate: async ({ auth }) => {
		const problem = findInputProblem(auth);
		if (!isNil(problem)) {
			return { valid: false, error: problem };
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
			return {
				valid: false,
				error:
					error instanceof JsmApiError && error.status === 404
						? 'The login works, but Jira Service Management was not found on this site.'
						: error instanceof Error
							? error.message
							: 'Could not reach Jira Service Management on this site.',
			};
		}
	},
	getConnectionIdentifier: async ({ auth }) => {
		try {
			const user = await jsmClient.request<JsmUser>({ auth, api: 'jira', method: HttpMethod.GET, path: '/myself' });
			const who = user.emailAddress ?? user.displayName ?? user.name;
			const host = new URL(jsmClient.instanceUrl(auth)).host;
			return isNil(who) ? host : `${who} (${host})`;
		} catch {
			return undefined;
		}
	},
});

function findInputProblem(auth: JsmAuthProps): string | undefined {
	if (!isValidUrl(auth.instanceUrl)) {
		return 'Instance URL must be a full link, for example https://example.atlassian.net';
	}
	if (jsmClient.isCloud(auth) && (isNil(auth.email) || auth.email.trim().length === 0)) {
		return 'Email is required for Jira Cloud.';
	}
	return undefined;
}

function isValidUrl(value: string): boolean {
	try {
		const url = new URL(value.trim());
		return url.protocol === 'https:' || url.protocol === 'http:';
	} catch {
		return false;
	}
}
