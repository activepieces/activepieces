import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowClient } from '../../../common/client';
import { webflowGetFormOutputSchema } from '../../../output-schemas';

export const getFormAction = createAction({
	auth: webflowAuth,
	name: 'webflow_get_form',
	outputSchema: webflowGetFormOutputSchema,
	displayName: 'Get Form',
	description: 'Gets the schema of a form.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Returns one form's schema: name, page, form element id, response settings and its fields with their types, including hidden fields. Get the form id from List Forms. Webflow answers 409 until the site has been published, so run Publish Site first if it does.",
		idempotent: true,
	},
	props: {
		formId: Property.ShortText({
			displayName: 'Form ID',
			description: 'Form ID. Use List Forms to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/forms/${encodeURIComponent(context.propsValue.formId)}`,
		});
	},
});
