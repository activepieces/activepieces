import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { taskadeApi } from './common/client';

export const taskadeAuth = PieceAuth.SecretText({
	displayName: 'Personal Token',
	required: true,
	description: `
	1. Go to https://www.taskade.com/settings/api (Settings > API).
	2. Under Personal Access Tokens, create a token with any name and copy it (it starts with tskdp_).`,
	validate: async ({ auth }) => {
		try {
			await taskadeApi.request({
				token: auth,
				method: HttpMethod.GET,
				path: '/workspaces',
				operation: 'check token',
				timeoutMs: 15_000,
			});
			return { valid: true };
		} catch (error) {
			const status = taskadeApi.statusOf(error);
			if (status === 401 || status === 403) {
				return { valid: false, error: 'Invalid personal access token. Create a new one at https://www.taskade.com/settings/api.' };
			}
			const message = error instanceof Error ? error.message : String(error);
			return { valid: false, error: `Could not check the token with Taskade: ${message.slice(0, 300)}` };
		}
	},
});
