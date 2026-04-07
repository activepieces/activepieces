import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const searchTechnologyCategories = createAction({
	auth: pubrioAuth,
	name: 'search_technology_categories',
	displayName: 'Search Technology Categories',
	description: 'Search available technology categories by keyword',
	props: {
		keyword: Property.ShortText({ displayName: 'Keyword', required: false, description: 'Search keyword to filter technology categories' }),
	},
	async run(context) {
		const body: Record<string, unknown> = {};
		if (context.propsValue.keyword) body.keyword = context.propsValue.keyword;
		return await pubrioRequest(context.auth, HttpMethod.POST, '/technologies/categories', body);
	},
});
