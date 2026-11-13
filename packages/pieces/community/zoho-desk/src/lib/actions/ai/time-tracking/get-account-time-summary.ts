import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetAccountTimeSummaryOutputSchema } from '../../../output-schemas';

export const zohoDeskGetAccountTimeSummaryAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_account_time_summary',
	outputSchema: zohoDeskGetAccountTimeSummaryOutputSchema,
	displayName: 'Get Account Time Summary',
	description: 'Get Account Time Summary.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: "Returns the total time and cost logged on one account's records.",
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
		module: Property.StaticDropdown({
			displayName: 'Module',
			description: 'Only entries logged on this kind of record.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'tickets', value: 'tickets' },
					{ label: 'tasks', value: 'tasks' },
					{ label: 'calls', value: 'calls' },
					{ label: 'events', value: 'events' },
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
		const { orgId, accountId, module, departmentId, billStatus } = context.propsValue;
		return await zohoDeskApi.getAccountTimeSummary({
			auth: context.auth,
			orgId,
			accountId,
			module,
			departmentId,
			billStatus,
		});
	},
});
