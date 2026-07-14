import { hubspotAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';
import { pageType } from '../common/props';

export const deletePageAction = createAction({
	auth: hubspotAuth,
	name: 'delete-page',
	displayName: 'Delete Page',
	description: 'Deletes an existing landing/site page.',
	audience: 'both',
	aiMetadata: { description: 'Archive (delete) a HubSpot CMS landing page or site page by its ID; select the matching Page Type. Deleting an already-deleted page is harmless, so the operation is effectively idempotent on the end state. This is destructive and cannot be undone here.', idempotent: true },
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
