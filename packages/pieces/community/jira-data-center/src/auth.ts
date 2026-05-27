import {
	AppConnectionValueForAuthProperty,
	PieceAuth,
	Property,
} from '@activepieces/pieces-framework';
import { sendJiraRequest } from './lib/common';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/shared';

export const jiraDataCenterAuth = PieceAuth.CustomAuth({
	description: `
To generate a Personal Access Token (PAT):
1. Log in to your Jira Data Center instance.
2. Click your **profile icon** (top-right) → **Profile**.
3. Go to **Personal Access Tokens** → **Create token**.
4. Set a name and expiry, then copy the generated token.
    `,
	required: true,
	props: {
		instanceUrl: Property.ShortText({
			displayName: 'Instance URL',
			description:
				'The URL of your Jira Data Center instance (e.g. https://jira.yourcompany.com)',
			required: true,
		}),
		personalAccessToken: PieceAuth.SecretText({
			displayName: 'Personal Access Token',
			description: 'Your Jira Data Center Personal Access Token (PAT)',
			required: true,
		}),
	},
	validate: async ({ auth }) => {
		try {
			await propsValidation.validateZod(auth, {
				instanceUrl: z.string().url(),
			});

			await sendJiraRequest({
				auth: {
					type: AppConnectionType.CUSTOM_AUTH,
					props: auth,
				},
				method: HttpMethod.GET,
				url: 'myself',
			});
			return {
				valid: true,
			};
		} catch (e) {
			const message = ((e as HttpError).response?.body as any)?.message;
			return {
				valid: false,
				error: message ?? 'Invalid credentials',
			};
		}
	},
});

export type JiraDataCenterAuth = AppConnectionValueForAuthProperty<typeof jiraDataCenterAuth>;
