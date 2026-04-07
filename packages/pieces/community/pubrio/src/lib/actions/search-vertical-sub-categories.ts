import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const searchVerticalSubCategories = createAction({
	auth: pubrioAuth,
	name: 'search_vertical_sub_categories',
	displayName: 'Search Vertical Sub-Categories',
	description: 'Search available vertical sub-categories by keyword',
	props: {
		keyword: Property.ShortText({ displayName: 'Keyword', required: false, description: 'Search keyword to filter vertical sub-categories' }),
	},
	async run(context) {
		const body: Record<string, unknown> = {};
		if (context.propsValue.keyword) body.keyword = context.propsValue.keyword;
		return await pubrioRequest(context.auth, HttpMethod.POST, '/verticals/sub_categories', body);
	},
});
