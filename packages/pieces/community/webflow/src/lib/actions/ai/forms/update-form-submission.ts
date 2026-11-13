import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowClient } from '../../../common/client';
import { webflowUpdateFormSubmissionOutputSchema } from '../../../output-schemas';

export const updateFormSubmissionAction = createAction({
	auth: webflowAuth,
	name: 'webflow_update_form_submission',
	outputSchema: webflowUpdateFormSubmissionOutputSchema,
	displayName: 'Update Form Submission',
	description: 'Sets hidden field values on a form submission.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets the values of hidden fields on a form submission; only hidden fields already defined on the form can be set, and fields not given keep their value. Get Form lists the form fields. Get the submission id from List Form Submissions or List Site Form Submissions. Webflow answers 409 until the site has been published, so run Publish Site first if it does.',
		idempotent: true,
	},
	props: {
		formSubmissionId: Property.ShortText({
			displayName: 'Form Submission ID',
			description: 'Form submission ID. Use List Form Submissions to find it.',
			required: true,
		}),
		formSubmissionData: Property.Json({
			displayName: 'Hidden Field Values',
			description: 'JSON object mapping each hidden field name on the form to its new value, e.g. {"status": "contacted"}.',
			required: true,
		}),
	},
	async run(context) {
		const { formSubmissionId, formSubmissionData } = context.propsValue;
		if (Array.isArray(formSubmissionData) || Object.keys(formSubmissionData).length === 0) {
			throw new Error('formSubmissionData must be a JSON object with at least one hidden field.');
		}
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.PATCH,
			path: `/v2/form_submissions/${encodeURIComponent(formSubmissionId)}`,
			body: { formSubmissionData },
		});
	},
});
