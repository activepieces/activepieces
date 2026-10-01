import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';

export const deleteCompany = createAction({
	auth: sendinblueAuth,
	name: 'delete_company',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Company',
	description: 'Permanently delete a Brevo CRM company.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently removes a Brevo CRM company record by id. This cannot be undone, and contacts or deals linked to the company are not themselves deleted. Not idempotent — a retry after the first successful call 404s because the company no longer exists.',
		idempotent: false,
	},
	props: {
		company_id: Property.ShortText({
			displayName: 'Company ID',
			description: "The Brevo company id, e.g. '61a5cd07ca1347c82306ad06'.",
			required: true,
		}),
	},
	async run(context) {
		const { company_id } = context.propsValue;

		await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.DELETE,
			resourceUri: `/companies/${encodeURIComponent(company_id)}`,
		});

		return { success: true };
	},
});
