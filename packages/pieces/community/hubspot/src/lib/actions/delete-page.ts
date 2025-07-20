import { hubspotAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';
import { pageType } from '../common/props';

export const deletePageAction = createAction({
	auth: hubspotAuth,
	name: 'delete-page',
	displayName: 'Delete Page',
	description: 'Deletes an existing landing/site page.',
	props: {
		pageType: pageType,
		pageId: Property.ShortText({
			displayName: 'Page ID',
			description: 'The ID of the page to delete.',
			required: true,
		}),
	},
	async run(context) {
		const { pageId, pageType } = context.propsValue;
		const client = new Client({ accessToken: context.auth.access_token });

		if (pageType === 'site_page') {
			return await client.cms.pages.sitePagesApi.archive(pageId);
		} else {
			return await client.cms.pages.landingPagesApi.archive(pageId);
		}
	},
});
