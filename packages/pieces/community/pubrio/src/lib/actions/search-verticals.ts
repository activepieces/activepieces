import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const searchVerticals = createAction({
	auth: pubrioAuth,
	name: 'search_verticals',
	displayName: 'Search Verticals',
	description: 'Search available industry verticals by keyword',
	props: {
		keyword: Property.ShortText({ displayName: 'Keyword', required: false, description: 'Search keyword to filter verticals' }),
	},
	async run(context) {
		const body: Record<string, unknown> = {};
		if (context.propsValue.keyword) body.keyword = context.propsValue.keyword;
		return await pubrioRequest(context.auth as string, HttpMethod.POST, '/verticals', body);
	},
});
