import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { getFormOutputSchema } from '../output-schemas';

export const getForm = createAction({
	auth: tallyAuth,
	name: 'get_form',
	displayName: 'Get Form',
	description: 'Fetches a form by id, including its blocks and settings.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fetches a single Tally form by id, returning the full form object with all blocks (questions) and settings. Use to inspect the structure of a form before Update Form, or to read the question list embedded in the form. Obtain the id from List Forms.',
		idempotent: true,
	},
	outputSchema: getFormOutputSchema,
	props: {
		form_id: Property.ShortText({
			displayName: 'Form ID',
			description: 'The id of the form. Obtain from List Forms.',
			required: true,
		}),
	},
	async run(context) {
		return tallyApiClient.request<Record<string, unknown>>({
			method: HttpMethod.GET,
			path: `/forms/${context.propsValue.form_id}`,
			apiKey: context.auth.secret_text,
		});
	},
});
