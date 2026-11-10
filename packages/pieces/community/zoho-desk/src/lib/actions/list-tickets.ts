import { createAction, Property } from '@activepieces/pieces-framework';
import { zohoDeskAuth } from '../auth';
import { zohoDeskApi } from '../common/api';
import { zohoDeskProps } from '../common/props';
import { listTicketsOutputSchema } from '../output-schemas';

export const listTicketsAction = createAction({
	auth: zohoDeskAuth,
	name: 'list_tickets',
	outputSchema: listTicketsOutputSchema,
	classification: 'SEARCH',
	description: 'List tickets',
	audience: 'human',
	aiMetadata: { description: 'Retrieves tickets from a Zoho Desk organization, optionally expanding related data (contacts, products, departments, team, isRead, assignee) via the include option. Use to browse or page through existing tickets when you do not have a specific ticket ID; requires the organization ID. Read-only and idempotent.', idempotent: true },
	displayName: 'List tickets.',
	props: {
		orgId: zohoDeskProps.orgId({ required: true }),
		include: Property.StaticMultiSelectDropdown({
			displayName: 'include',
			required: false,
			description: 'Additional information related to the tickets.',
			options: {
				disabled: false,
				options: [
					{ label: 'contacts', value: 'contacts' },
					{ label: 'products', value: 'products' },
					{ label: 'departments', value: 'departments' },
					{ label: 'team', value: 'team' },
					{ label: 'isRead', value: 'isRead' },
					{ label: 'assignee', value: 'assignee' },
				],
			},
		}),
	},
	async run({ propsValue, auth }) {
		return await zohoDeskApi.listTickets({ auth, orgId: propsValue.orgId, include: propsValue.include });
	},
});
