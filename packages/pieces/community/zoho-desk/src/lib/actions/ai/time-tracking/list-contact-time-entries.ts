import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountTimeEntriesOutputSchema } from '../../../output-schemas';

export const zohoDeskListContactTimeEntriesAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_contact_time_entries',
	outputSchema: zohoDeskListAccountTimeEntriesOutputSchema,
	displayName: 'List Contact Time Entries',
	description: 'List Contact Time Entries.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: "Lists the time entries logged on one contact's tickets and tasks.",
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		module: Property.StaticDropdown({
			displayName: 'Module',
			description: 'Only entries logged on tickets or tasks.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'tickets', value: 'tickets' },
					{ label: 'tasks', value: 'tasks' },
				],
			},
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		billStatus: Property.StaticDropdown({
			displayName: 'Bill Status',
			description: 'Only entries with this billing status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'billable', value: 'billable' },
					{ label: 'nonBillable', value: 'nonBillable' },
					{ label: 'billed', value: 'billed' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, contactId, module, departmentId, billStatus, from, limit } = context.propsValue;
		const timeEntries = await zohoDeskApi.listContactTimeEntries({
			auth: context.auth,
			orgId,
			contactId,
			module,
			departmentId,
			billStatus,
			from,
			limit,
		});
		return { timeEntries, count: timeEntries.length };
	},
});
