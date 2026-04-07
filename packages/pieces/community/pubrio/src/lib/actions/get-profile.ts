import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const getProfile = createAction({
	auth: pubrioAuth,
	name: 'get_profile',
	displayName: 'Get Profile',
	description: 'Get your Pubrio account profile information',
	props: {},
	async run(context) {
		return await pubrioRequest(context.auth as string, HttpMethod.POST, '/profile');
	},
});
