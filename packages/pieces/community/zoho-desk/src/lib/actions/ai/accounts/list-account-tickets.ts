import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountTicketsOutputSchema } from '../../../output-schemas';

export const zohoDeskListAccountTicketsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_account_tickets',
	outputSchema: zohoDeskListAccountTicketsOutputSchema,
	displayName: 'List Account Tickets',
	description: 'Lists the tickets of an account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the tickets raised by contacts of one account, optionally only in one department.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
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
		const { orgId, accountId, departmentId, sortBy, from, limit } = context.propsValue;
		const tickets = await zohoDeskApi.listAccountTickets({
			auth: context.auth,
			orgId,
			accountId,
			departmentId,
			sortBy,
			from,
			limit,
		});
		return { tickets, count: tickets.length };
	},
});
