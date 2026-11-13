import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartSuiteClient } from './common/client';

export const smartsuiteAuth = PieceAuth.CustomAuth({
	description: `
  You can obtain API key by navigate to **My Profile->API Key** from top-right corner.
  
  You can obtain Account ID from browser URL.For example, if smartsuite workspace URL is https://app.smartsuite.com/xyz/home, your Account ID is **xyz**.`,
	required: true,
	props: {
		apiKey: PieceAuth.SecretText({
			displayName: 'API Key',
			required: true,
		}),
		accountId: Property.ShortText({
			displayName: 'Account ID',
			required: true,
		}),
	},
	validate: async ({ auth }) => {
		try {
			await smartSuiteClient.request<unknown>({
				credentials: { apiKey: auth.apiKey, accountId: auth.accountId },
				method: HttpMethod.GET,
				path: '/solutions/',
				operation: 'check credentials',
			});
			return { valid: true };
		} catch (error) {
			return { valid: false, error: validationMessage(error) };
		}
	},
});

function validationMessage(error: unknown): string {
	const status = smartSuiteClient.statusOf(error);
	if (status === 401 || status === 403) {
		return 'Invalid Credentials. Check the API key and the Account ID.';
	}
	if (status === 402) {
		return 'This SmartSuite workspace has no API access: its trial or plan has expired or does not include the API.';
	}
	return `Could not reach SmartSuite to check the credentials: ${error instanceof Error ? error.message : String(error)}`;
}
