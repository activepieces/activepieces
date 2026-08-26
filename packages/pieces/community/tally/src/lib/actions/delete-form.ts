import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { deleteFormOutputSchema } from '../output-schemas';

export const deleteForm = createAction({
	auth: tallyAuth,
	name: 'delete_form',
	displayName: 'Delete Form',
	description: 'Moves a form to trash (soft delete — recoverable via Tally UI).',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			"Moves a Tally form to the trash. This is a soft delete — the form is recoverable from the trash in Tally's UI. Existing submissions and webhooks remain queryable via the trashed form's id. Re-invoking on an already-trashed form is a no-op. Prefer Update Form to set the status to DRAFT if you want to unpublish without deleting.",
		idempotent: true,
	},
	outputSchema: deleteFormOutputSchema,
	props: {
		form_id: Property.ShortText({
			displayName: 'Form ID',
			description: 'The id of the form to trash. Obtain from List Forms.',
			required: true,
		}),
	},
	async run(context) {
		await tallyApiClient.request<void>({
			method: HttpMethod.DELETE,
			path: `/forms/${context.propsValue.form_id}`,
			apiKey: context.auth.secret_text,
		});
		return { form_id: context.propsValue.form_id, deleted: true };
	},
});
