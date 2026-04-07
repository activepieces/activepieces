import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const getManagementLevels = createAction({
	auth: pubrioAuth,
	name: 'get_management_levels',
	displayName: 'Get Management Levels',
	description: 'Get the list of available management levels for filtering',
	props: {},
	async run(context) {
		return await pubrioRequest(context.auth, HttpMethod.GET, '/management_levels');
	},
});
