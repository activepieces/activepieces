import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { getEmailTemplateActionOutputSchema } from '../output-schemas';

export const getEmailTemplate = createAction({
	auth: sendinblueAuth,
	name: 'get_email_template',
	outputSchema: getEmailTemplateActionOutputSchema,
	classification: 'READ',
	displayName: 'Get Email Template',
	description: 'Fetch a single Brevo email template by id.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Looks up a single Brevo email template by its id and returns its full details including subject, sender and HTML content. Returns found:false instead of failing when no template matches, so it is safe to branch on. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		template_id: Property.ShortText({
			displayName: 'Template ID',
			description: 'The id of the template to fetch, for example 12.',
			required: true,
		}),
	},
	async run(context) {
		const { template_id } = context.propsValue;

		try {
			const template = await brevoCommon.apiCall({
				apiKey: context.auth.secret_text,
				method: HttpMethod.GET,
				resourceUri: `/smtp/templates/${encodeURIComponent(template_id)}`,
			});

			return { found: true, data: template };
		} catch (error) {
			if (error instanceof HttpError && error.response.status === 404) {
				return { found: false, data: {} };
			}
			throw error;
		}
	},
});
