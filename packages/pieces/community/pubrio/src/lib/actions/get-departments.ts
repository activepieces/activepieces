import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const getDepartments = createAction({
	auth: pubrioAuth,
	name: 'get_departments',
	displayName: 'Get Departments',
	description: 'Get the list of available department titles for filtering',
	props: {},
	async run(context) {
		return await pubrioRequest(context.auth as string, HttpMethod.GET, '/departments/title');
	},
});
