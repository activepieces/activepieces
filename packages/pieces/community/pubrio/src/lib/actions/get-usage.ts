import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const getUsage = createAction({
	auth: pubrioAuth,
	name: 'get_usage',
	displayName: 'Get Usage',
	description: 'Get your Pubrio API usage statistics',
	props: {},
	async run(context) {
		return await pubrioRequest(context.auth as string, HttpMethod.POST, '/profile/usage');
	},
});
