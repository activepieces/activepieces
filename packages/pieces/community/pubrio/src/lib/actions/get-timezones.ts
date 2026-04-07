import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const getTimezones = createAction({
	auth: pubrioAuth,
	name: 'get_timezones',
	displayName: 'Get Timezones',
	description: 'Get the list of available timezones for filtering',
	props: {},
	async run(context) {
		return await pubrioRequest(context.auth as string, HttpMethod.GET, '/timezones');
	},
});
