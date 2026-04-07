import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const getDepartmentFunctions = createAction({
	auth: pubrioAuth,
	name: 'get_department_functions',
	displayName: 'Get Department Functions',
	description: 'Get the list of available department functions for filtering',
	props: {},
	async run(context) {
		return await pubrioRequest(context.auth as string, HttpMethod.GET, '/departments/function');
	},
});
