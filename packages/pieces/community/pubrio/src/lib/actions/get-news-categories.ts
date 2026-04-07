import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const getNewsCategories = createAction({
	auth: pubrioAuth,
	name: 'get_news_categories',
	displayName: 'Get News Categories',
	description: 'Get the list of available news categories for filtering',
	props: {},
	async run(context) {
		return await pubrioRequest(context.auth, HttpMethod.GET, '/companies/news/categories');
	},
});
