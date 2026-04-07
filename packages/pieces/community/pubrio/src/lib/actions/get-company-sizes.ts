import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const getCompanySizes = createAction({
	auth: pubrioAuth,
	name: 'get_company_sizes',
	displayName: 'Get Company Sizes',
	description: 'Get the list of available company size ranges for filtering',
	props: {},
	async run(context) {
		return await pubrioRequest(context.auth as string, HttpMethod.GET, '/company_sizes');
	},
});
