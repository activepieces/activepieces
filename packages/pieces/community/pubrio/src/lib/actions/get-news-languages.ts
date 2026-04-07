import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const getNewsLanguages = createAction({
	auth: pubrioAuth,
	name: 'get_news_languages',
	displayName: 'Get News Languages',
	description: 'Get the list of available news languages for filtering',
	props: {},
	async run(context) {
		return await pubrioRequest(context.auth as string, HttpMethod.GET, '/companies/news/languages');
	},
});
