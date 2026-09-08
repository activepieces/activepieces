import { createAction } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { formsDropdown } from '../common/props';

export const deleteFormAction = createAction({
	auth: tallyAuth,
	name: 'delete_form',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Form',
	description: 'Permanently delete a form',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes a form and its submissions — Tally has no trash/undo for this endpoint, so confirm the caller genuinely wants the whole form removed. A repeat call errors once the form is gone, so this is not idempotent.',
		idempotent: false,
	},
	props: {
		form_id: formsDropdown,
	},
	async run(context) {
		const { auth, propsValue } = context;
		await tallyApiClient.deleteForm({ apiKey: auth.secret_text, formId: propsValue.form_id });
		return { formId: propsValue.form_id, deleted: true };
	},
});
