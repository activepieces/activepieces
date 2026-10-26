import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskCloseTicketsOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateManyTicketsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_many_tickets',
	outputSchema: zohoDeskCloseTicketsOutputSchema,
	displayName: 'Update Many Tickets',
	description: 'Sets one field to the same value on several tickets.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets one field (by API name, e.g. "priority" or "cf_region") to the same value on several tickets at once. Use Update Ticket to change several fields on one ticket.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketIds: Property.Array({
			displayName: 'Ticket IDs',
			description: 'Ticket IDs to update.',
			required: true,
		}),
		fieldName: Property.ShortText({
			displayName: 'Field Name',
			description: 'API name of the field to set, e.g. "priority" (names from List Fields).',
			required: true,
		}),
		fieldValue: Property.ShortText({
			displayName: 'Field Value',
			description: 'Value to set. Leave empty to clear the field.',
			required: false,
		}),
		isCustomField: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Custom Field',
			description: 'Yes when Field Name is a custom field.',
		}),
	},
	async run(context) {
		const { orgId, ticketIds, fieldName, fieldValue, isCustomField } = context.propsValue;
		await zohoDeskApi.updateManyTickets({
			auth: context.auth,
			orgId,
			ticketIds: zohoDeskUtils.requiredStringList({ value: ticketIds, propName: 'Ticket IDs' }),
			fieldName,
			fieldValue,
			isCustomField,
		});
		return { success: true, ticketIds };
	},
});
