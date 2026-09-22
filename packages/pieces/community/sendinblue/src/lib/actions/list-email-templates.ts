import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { listEmailTemplatesActionOutputSchema } from '../output-schemas';

export const listEmailTemplates = createAction({
	auth: sendinblueAuth,
	name: 'list_email_templates',
	outputSchema: listEmailTemplatesActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Email Templates',
	description: 'List email templates in your Brevo account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists Brevo email templates, optionally filtered to only active or only inactive ones. Use Get Email Template to fetch the full details of one template once you have its id from this list. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		template_status: Property.Checkbox({
			displayName: 'Template Status',
			description:
				'Filter to active (checked) or inactive (unchecked) templates; leave unset to return both.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum number of templates to return. Defaults to 50, max 1000.',
			required: false,
			defaultValue: 50,
		}),
		offset: Property.Number({
			displayName: 'Offset',
			description: 'Number of templates to skip before starting to return results.',
			required: false,
			defaultValue: 0,
		}),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			description: 'Sort order applied to the results, based on creation date.',
			required: false,
			options: {
				options: [
					{ label: 'Ascending', value: 'asc' },
					{ label: 'Descending', value: 'desc' },
				],
			},
		}),
	},
	async run(context) {
		const { template_status, limit, offset, sort } = context.propsValue;

		return await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/smtp/templates',
			query: {
				templateStatus: template_status,
				limit,
				offset,
				sort,
			},
		});
	},
});
