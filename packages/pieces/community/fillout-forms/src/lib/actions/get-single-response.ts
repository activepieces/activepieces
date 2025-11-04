import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { formIdDropdown, submissionIdDropdown } from '../common/props';
import { filloutFormsAuth } from '../../index';

export const getSingleResponse = createAction({
	auth: filloutFormsAuth,
	name: 'getSingleResponse',
	displayName: 'Get Single Response',
	description: 'Retrieves a specific submission from a form.',
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
		const apiKey = context.auth as string;

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
