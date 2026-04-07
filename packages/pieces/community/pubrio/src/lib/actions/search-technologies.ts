import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const searchTechnologies = createAction({
	auth: pubrioAuth,
	name: 'search_technologies',
	displayName: 'Search Technologies',
	description: 'Search available technologies by keyword',
	props: {
		keyword: Property.ShortText({ displayName: 'Keyword', required: false, description: 'Search keyword to filter technologies' }),
	},
	async run(context) {
		const body: Record<string, unknown> = {};
		if (context.propsValue.keyword) body.keyword = context.propsValue.keyword;
		return await pubrioRequest(context.auth, HttpMethod.POST, '/technologies', body);
	},
});
