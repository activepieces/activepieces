import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { formIdDropdown, submissionIdDropdown } from '../common/props';
import { filloutFormsAuth } from '../auth';

export const getSingleResponse = createAction({
	auth: filloutFormsAuth,
	name: 'getSingleResponse',
	displayName: 'Get Single Response',
	description: 'Retrieves a specific submission from a form.',
	audience: 'both',
	aiMetadata: { description: 'Retrieves one specific submission from a Fillout form, keyed by form ID and submission ID. Use when you already know the submission ID and need its full details, rather than listing all responses. Read-only and idempotent.', idempotent: true },
	props: {
		formId: formIdDropdown,
		submissionId: submissionIdDropdown,
		includeEditLink: Property.Checkbox({
			displayName: 'Include Edit Link',
			required: false,
			description: 'Include a link to edit the submission.',
		}),
	},
	async run(context) {
		const apiKey = context.auth.secret_text;

		const { formId, submissionId } = context.propsValue;

		const queryParams: Record<string, any> = {};
		if (context.propsValue['includeEditLink'] !== undefined) {
			queryParams['includeEditLink'] = context.propsValue['includeEditLink'];
		}

		const response = await makeRequest(
			apiKey,
			HttpMethod.GET,
			`/forms/${formId}/submissions/${submissionId}`,
			queryParams,
		);
		return response;
	},
});
