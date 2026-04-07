import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const searchVerticalCategories = createAction({
	auth: pubrioAuth,
	name: 'search_vertical_categories',
	displayName: 'Search Vertical Categories',
	description: 'Search available vertical categories by keyword',
	props: {
		keyword: Property.ShortText({ displayName: 'Keyword', required: false, description: 'Search keyword to filter vertical categories' }),
	},
	async run(context) {
		const body: Record<string, unknown> = {};
		if (context.propsValue.keyword) body.keyword = context.propsValue.keyword;
		return await pubrioRequest(context.auth, HttpMethod.POST, '/verticals/categories', body);
	},
});
