import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowListFormSubmissionsOutputSchema } from '../../../output-schemas';

export const listSiteFormSubmissionsAction = createAction({
	auth: webflowAuth,
	name: 'webflow_list_site_form_submissions',
	outputSchema: webflowListFormSubmissionsOutputSchema,
	displayName: 'List Site Form Submissions',
	description: 'Lists the form submissions of a site.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the form submissions across a whole site, optionally only those of one form element, which also gathers every component instance of that form. Pages with limit and offset. Get the site id from List Sites and the element id (formElementId) from List Forms. Webflow answers 409 until the site has been published, so run Publish Site first if it does.',
		idempotent: true,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		elementId: Property.ShortText({
			displayName: 'Form Element ID',
			description: 'Only return submissions of this form element: the formElementId from List Forms.',
			required: false,
		}),
		limit: webflowAiProps.limit({ required: false }),
		offset: webflowAiProps.offset({ required: false }),
	},
	async run(context) {
		const { siteId, elementId, limit, offset } = context.propsValue;
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/sites/${encodeURIComponent(siteId)}/form_submissions`,
			query: {
				...(elementId ? { elementId } : {}),
				limit: String(limit ?? 100),
				offset: String(offset ?? 0),
			},
		});
	},
});
