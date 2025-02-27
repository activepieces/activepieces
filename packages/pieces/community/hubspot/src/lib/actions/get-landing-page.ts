import { hubspotAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';

export const getLandingPageAction = createAction({
	auth: hubspotAuth,
	name: 'get-landing-page',
	displayName: 'Get Landing Page',
	description: 'Gets landing page deatils.',
	props: {
		pageId: Property.ShortText({
			displayName: 'Page ID',
			description: 'The ID of the landing page to get.',
			required: true,
		}),
	},
	async run(context) {
		const { pageId } = context.propsValue;
		const client = new Client({ accessToken: context.auth.access_token });

		const response = await client.cms.pages.landingPagesApi.getById(pageId);

		return response;
	},
});
