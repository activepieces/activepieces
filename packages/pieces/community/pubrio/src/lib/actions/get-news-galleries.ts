import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const getNewsGalleries = createAction({
	auth: pubrioAuth,
	name: 'get_news_galleries',
	displayName: 'Get News Galleries',
	description: 'Get the list of available news galleries for filtering',
	props: {},
	async run(context) {
		return await pubrioRequest(context.auth as string, HttpMethod.GET, '/companies/news/galleries');
	},
});
