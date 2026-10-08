import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { listFormSubscribersOutputSchema } from '../output-schemas';

export const listFormSubscribersAction = createAction({
	auth: mailerLiteAuth,
	name: 'list_form_subscribers',
	classification: 'SEARCH',
	displayName: 'List Form Subscribers',
	description: 'List the subscribers who signed up through a form.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the subscribers who signed up through a MailerLite form, given the form ID from list_forms. By default MailerLite returns active subscribers only; set status to list others. Cursor-paginated: pass meta.next_cursor back as cursor to get the next page. Read-only.',
		idempotent: true,
	},
	outputSchema: listFormSubscribersOutputSchema,
	props: {
		form_id: Property.ShortText({
			displayName: 'Form ID',
			description: 'The form ID, from list_forms.',
			required: true,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only return subscribers with this status. MailerLite defaults to active.',
			required: false,
			options: {
				options: [
					{ label: 'Active', value: 'active' },
					{ label: 'Unsubscribed', value: 'unsubscribed' },
					{ label: 'Unconfirmed', value: 'unconfirmed' },
					{ label: 'Bounced', value: 'bounced' },
					{ label: 'Junk', value: 'junk' },
				],
			},
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Items to return (1-1000, default 25).',
			required: false,
			defaultValue: 25,
		}),
		cursor: Property.ShortText({
			displayName: 'Cursor',
			description: 'The meta.next_cursor value from the previous page. Leave empty for the first page.',
			required: false,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.form_id, label: 'Form ID' });
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/forms/${id}/subscribers`,
			resource: `form ${id}`,
			queryParams: {
				'filter[status]': context.propsValue.status,
				limit: mailerLiteApi.resolveLimit({ value: context.propsValue.limit, fallback: 25, max: 1000 }),
				cursor: context.propsValue.cursor,
			},
		});
		return body;
	},
});
