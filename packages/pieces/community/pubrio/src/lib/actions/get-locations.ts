import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const getLocations = createAction({
	auth: pubrioAuth,
	name: 'get_locations',
	displayName: 'Get Locations',
	description: 'Get the list of available location codes for filtering',
	props: {},
	async run(context) {
		return await pubrioRequest(context.auth, HttpMethod.GET, '/locations');
	},
});
