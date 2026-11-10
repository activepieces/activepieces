import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetAccountTimeSummaryOutputSchema } from '../../../output-schemas';

export const zohoDeskGetContactTimeSummaryAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_contact_time_summary',
	outputSchema: zohoDeskGetAccountTimeSummaryOutputSchema,
	displayName: 'Get Contact Time Summary',
	description: 'Get Contact Time Summary.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: "Returns the total time and cost logged on one contact's tickets and tasks.",
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
			description: 'Only time logged on tickets or tasks.',
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
	},
	async run(context) {
		const { orgId, contactId, module, departmentId, billStatus } = context.propsValue;
		return await zohoDeskApi.getContactTimeSummary({
			auth: context.auth,
			orgId,
			contactId,
			module,
			departmentId,
			billStatus,
		});
	},
});
