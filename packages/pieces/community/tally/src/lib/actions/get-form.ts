import { createAction } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { formsDropdown } from '../common/props';
import { getFormActionOutputSchema } from '../output-schemas';

export const getFormAction = createAction({
	auth: tallyAuth,
	name: 'get_form',
	classification: 'READ',
	displayName: 'Get Form',
	description: 'Get a single form by id, including its blocks and settings',
	audience: 'ai',
	outputSchema: getFormActionOutputSchema,
	aiMetadata: {
		description:
			'Fetches one form by id with its full definition — blocks (the form content/fields) and settings — in addition to the summary fields List Forms already returns. Use to inspect a form\'s exact block shape before calling Update Form or Create Form. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		form_id: formsDropdown,
	},
	async run(context) {
		const { auth, propsValue } = context;
		return tallyApiClient.getForm({ apiKey: auth.secret_text, formId: propsValue.form_id });
	},
});
