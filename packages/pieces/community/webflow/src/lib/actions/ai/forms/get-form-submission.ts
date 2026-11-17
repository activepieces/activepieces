import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowClient } from '../../../common/client';
import { webflowGetFormSubmissionOutputSchema } from '../../../output-schemas';

export const getFormSubmissionAction = createAction({
	auth: webflowAuth,
	name: 'webflow_get_form_submission',
	outputSchema: webflowGetFormSubmissionOutputSchema,
	displayName: 'Get Form Submission',
	description: 'Gets one form submission.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Returns one form submission: its form name, submit date, locale and field values. Get the submission id from List Form Submissions or List Site Form Submissions. Webflow answers 409 until the site has been published, so run Publish Site first if it does.",
		idempotent: true,
	},
	props: {
		formSubmissionId: Property.ShortText({
			displayName: 'Form Submission ID',
			description: 'Form submission ID. Use List Form Submissions to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/form_submissions/${encodeURIComponent(context.propsValue.formSubmissionId)}`,
		});
	},
});
