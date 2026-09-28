import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { getCompanyActionOutputSchema } from '../output-schemas';

export const getCompany = createAction({
	auth: sendinblueAuth,
	name: 'get_company',
	outputSchema: getCompanyActionOutputSchema,
	classification: 'READ',
	displayName: 'Get Company',
	description: 'Fetch a Brevo CRM company by its id.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Looks up a single Brevo CRM company by its id and returns its attributes and linked contacts/deals. Returns found:false instead of failing when no company matches that id, so it is safe to branch on. Read-only and idempotent.',
		idempotent: true,
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

		try {
			const company = await brevoCommon.apiCall({
				apiKey: context.auth.secret_text,
				method: HttpMethod.GET,
				resourceUri: `/companies/${encodeURIComponent(company_id)}`,
			});

			return { found: true, data: company };
		} catch (error) {
			if (error instanceof HttpError && error.response.status === 404) {
				return { found: false, data: {} };
			}
			throw error;
		}
	},
});
