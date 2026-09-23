import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { listFormsOutputSchema } from '../output-schemas';

export const listFormsAction = createAction({
	auth: mailerLiteAuth,
	name: 'list_forms',
	classification: 'SEARCH',
	displayName: 'List Forms',
	description: 'List signup forms of one type.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List MailerLite signup forms of one type (popup, embedded or promotion) with their IDs and conversion stats. Forms cannot be created through the API. Page-paginated. Read-only.',
		idempotent: true,
	},
	outputSchema: listFormsOutputSchema,
	props: {
		type: Property.StaticDropdown({
			displayName: 'Form Type',
			description: 'The type of forms to list.',
			required: true,
			options: {
				options: [
					{ label: 'Popup', value: 'popup' },
					{ label: 'Embedded', value: 'embedded' },
					{ label: 'Promotion', value: 'promotion' },
				],
			},
		}),
		name: Property.ShortText({
			displayName: 'Name Contains',
			description: 'Only return forms whose name contains this text.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Items to return (1-100, default 25).',
			required: false,
			defaultValue: 25,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number to return, starting at 1.',
			required: false,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.type, label: 'Form Type' });
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/forms/${id}`,
			resource: `forms ${id}`,
			queryParams: {
				'filter[name]': context.propsValue.name,
				limit: mailerLiteApi.resolveLimit({ value: context.propsValue.limit, fallback: 25, max: 100 }),
				page: mailerLiteApi.resolvePage(context.propsValue.page),
			},
		});
		return body;
	},
});
