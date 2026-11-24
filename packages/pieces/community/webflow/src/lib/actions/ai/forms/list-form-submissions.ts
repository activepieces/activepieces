import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowListFormSubmissionsOutputSchema } from '../../../output-schemas';

export const listFormSubmissionsAction = createAction({
	auth: webflowAuth,
	name: 'webflow_list_form_submissions',
	outputSchema: webflowListFormSubmissionsOutputSchema,
	displayName: 'List Form Submissions',
	description: 'Lists the submissions of a form.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the submissions of one form, each with its id, submit date and field values. Pages with limit and offset. A form inside a component counts as a separate form per instance; use List Site Form Submissions with the form element id to get them all. Get the form id from List Forms. Webflow answers 409 until the site has been published, so run Publish Site first if it does.',
		idempotent: true,
	},
	props: {
		formId: Property.ShortText({
			displayName: 'Form ID',
			description: 'Form ID. Use List Forms to find it.',
			required: true,
		}),
		limit: webflowAiProps.limit({ required: false }),
		offset: webflowAiProps.offset({ required: false }),
	},
	async run(context) {
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/forms/${encodeURIComponent(context.propsValue.formId)}/submissions`,
			query: {
				limit: String(context.propsValue.limit ?? 100),
				offset: String(context.propsValue.offset ?? 0),
			},
		});
	},
});
