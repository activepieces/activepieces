import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListContactTicketsOutputSchema } from '../../../output-schemas';

export const zohoDeskListContactTicketsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_contact_tickets',
	outputSchema: zohoDeskListContactTicketsOutputSchema,
	displayName: 'List Contact Tickets',
	description: 'Lists the tickets raised by a contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the tickets raised by one contact, optionally only in one department.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			description: 'Field to sort by.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'createdTime', value: 'createdTime' },
					{ label: 'modifiedTime', value: 'modifiedTime' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, contactId, departmentId, sortBy, from, limit } = context.propsValue;
		const tickets = await zohoDeskApi.listContactTickets({
			auth: context.auth,
			orgId,
			contactId,
			departmentId,
			sortBy,
			from,
			limit,
		});
		return { tickets, count: tickets.length };
	},
});
