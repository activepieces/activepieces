import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListTimeEntriesOutputSchema } from '../../../output-schemas';

export const listTimeEntriesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_time_entries',
	outputSchema: zohoInvoiceListTimeEntriesOutputSchema,
	displayName: 'List Time Entries',
	description: 'Lists the time entries logged in Zoho Invoice.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists time entries with time_entry_id, project, task, user, date, duration and billed status, one page at a time. Filter by project, user, a date range or a period/billing filter. Use List Projects and List Users to find the filter IDs.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({
			required: false,
			description: 'Only entries of this project. Use List Projects to find it.',
		}),
		userId: zohoInvoiceAiProps.userId({
			required: false,
			description: 'Only entries of this user. Use List Users to find it.',
		}),
		filterBy: Property.StaticDropdown({
			displayName: 'Filter',
			description:
				'Only entries in this period or billing status. Pick Custom Date with From Date and To Date. Empty = all entries.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'Date.All' },
					{ label: 'Today', value: 'Date.Today' },
					{ label: 'This Week', value: 'Date.ThisWeek' },
					{ label: 'This Month', value: 'Date.ThisMonth' },
					{ label: 'This Quarter', value: 'Date.ThisQuarter' },
					{ label: 'This Year', value: 'Date.ThisYear' },
					{ label: 'Previous Day', value: 'Date.PreviousDay' },
					{ label: 'Previous Week', value: 'Date.PreviousWeek' },
					{ label: 'Previous Month', value: 'Date.PreviousMonth' },
					{ label: 'Previous Quarter', value: 'Date.PreviousQuarter' },
					{ label: 'Previous Year', value: 'Date.PreviousYear' },
					{ label: 'Custom Date', value: 'Date.CustomDate' },
					{ label: 'Unbilled', value: 'Status.Unbilled' },
					{ label: 'Invoiced', value: 'Status.Invoiced' },
				],
			},
		}),
		fromDate: Property.ShortText({
			displayName: 'From Date',
			description: 'Only entries logged on or after this date, as yyyy-mm-dd.',
			required: false,
		}),
		toDate: Property.ShortText({
			displayName: 'To Date',
			description: 'Only entries logged on or before this date, as yyyy-mm-dd.',
			required: false,
		}),
		sortColumn: zohoInvoiceAiProps.sortColumn({
			required: false,
			description:
				'Field to sort by: project_name, task_name, user_name, log_date, timer_started_at or customer_name.',
		}),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listTimeEntries({
			auth,
			organizationId: propsValue.organizationId,
			projectId: propsValue.projectId,
			userId: propsValue.userId,
			filterBy: propsValue.filterBy,
			fromDate: propsValue.fromDate,
			toDate: propsValue.toDate,
			sortColumn: propsValue.sortColumn,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
