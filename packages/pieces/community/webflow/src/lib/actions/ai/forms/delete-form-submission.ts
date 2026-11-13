import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowClient } from '../../../common/client';
import { webflowDeleteFormSubmissionOutputSchema } from '../../../output-schemas';

export const deleteFormSubmissionAction = createAction({
	auth: webflowAuth,
	name: 'webflow_delete_form_submission',
	outputSchema: webflowDeleteFormSubmissionOutputSchema,
	displayName: 'Delete Form Submission',
	description: 'Permanently deletes a form submission.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a form submission; it cannot be restored. Get the submission id from List Form Submissions or List Site Form Submissions. Webflow answers 409 until the site has been published, so run Publish Site first if it does.',
		idempotent: false,
	},
	props: {
		formSubmissionId: Property.ShortText({
			displayName: 'Form Submission ID',
			description: 'Form submission ID. Use List Form Submissions to find it.',
			required: true,
		}),
	},
	async run(context) {
		const { formSubmissionId } = context.propsValue;
		await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: `/v2/form_submissions/${encodeURIComponent(formSubmissionId)}`,
		});
		return { success: true, formSubmissionId };
	},
});
