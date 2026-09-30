import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';

export const deleteEmailTemplate = createAction({
	auth: sendinblueAuth,
	name: 'delete_email_template',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Email Template',
	description: 'Delete an email template from your Brevo account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes a Brevo email template by id. Brevo only allows deleting an inactive template — if this fails, deactivate the template first via Create or Update Email Template with is_active unchecked. Not idempotent — a retry after success errors because the template no longer exists.',
		idempotent: false,
	},
	props: {
		template_id: Property.Number({
			displayName: 'Template ID',
			description: 'The id of the template to delete.',
			required: true,
		}),
	},
	async run(context) {
		const { template_id } = context.propsValue;

		await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.DELETE,
			resourceUri: `/smtp/templates/${template_id}`,
		});

		return { success: true };
	},
});
