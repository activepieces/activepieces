import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { listAutomationsOutputSchema } from '../output-schemas';

export const listAutomationsAction = createAction({
	auth: mailerLiteAuth,
	name: 'list_automations',
	classification: 'SEARCH',
	displayName: 'List Automations',
	description: 'List the automations in the account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List MailerLite automations with their IDs, enabled state and stats. Optionally filter by enabled state, name, or a group ID from list_groups. Page-paginated. Read-only.',
		idempotent: true,
	},
	outputSchema: listAutomationsOutputSchema,
	props: {
		enabled: Property.StaticDropdown({
			displayName: 'Enabled',
			description: 'Only return enabled or disabled automations.',
			required: false,
			options: {
				options: [
					{ label: 'Enabled', value: 'true' },
					{ label: 'Disabled', value: 'false' },
				],
			},
		}),
		name: Property.ShortText({
			displayName: 'Name Contains',
			description: 'Only return automations whose name contains this text.',
			required: false,
		}),
		group_id: Property.ShortText({
			displayName: 'Group ID',
			description: 'Only return automations that use this group, from list_groups.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Items to return (1-100, default 10).',
			required: false,
			defaultValue: 10,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number to return, starting at 1.',
			required: false,
		}),
	},
	async run(context) {
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: '/automations',
			queryParams: {
				'filter[enabled]': context.propsValue.enabled,
				'filter[name]': context.propsValue.name,
				'filter[group]': context.propsValue.group_id,
				limit: mailerLiteApi.resolveLimit({ value: context.propsValue.limit, fallback: 10, max: 100 }),
				page: mailerLiteApi.resolvePage(context.propsValue.page),
			},
		});
		return body;
	},
});
