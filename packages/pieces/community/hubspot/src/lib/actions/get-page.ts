import { hubspotAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';
import { pageType } from '../common/props';

export const getPageAction = createAction({
	auth: hubspotAuth,
	name: 'get-page',
	displayName: 'Get Page',
	description: 'Gets landing/site page Details.',
	props: {
		pageType: pageType,
		pageId: Property.ShortText({
			displayName: 'Page ID',
			description: 'The ID of the page to get.',
			required: true,
		}),
	},
	async run(context) {
		const { pageId, pageType } = context.propsValue;
		const client = new Client({ accessToken: context.auth.access_token });

		if (pageType === 'site_page') {
			return await client.cms.pages.sitePagesApi.getById(pageId);
		} else {
			return await client.cms.pages.landingPagesApi.getById(pageId);
		}
	},
});
