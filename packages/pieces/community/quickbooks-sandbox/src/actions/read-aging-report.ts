import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../lib/auth';
import { quickbooksCommon } from '../lib/common';
import { QuickbooksReport } from '../lib/types';

export const readAgingReportAction = createAction({
	auth: quickbooksAuth,
	name: 'read_aging_report',
	displayName: 'Read AR/AP Aging',
	description: 'Reads an accounts receivable or accounts payable aging report from QuickBooks.',
	audience: 'both',
	aiMetadata: {
		description: 'Fetch an aging report showing outstanding receivables (money owed to the company) or payables (money the company owes), bucketed by how overdue they are. Choose the report type, optionally set the as-of date, the number of days per aging bucket, and the number of buckets. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		reportType: Property.StaticDropdown({
			displayName: 'Report',
			required: true,
			options: {
				options: [
					{ label: 'A/R Aging Summary', value: 'AgedReceivables' },
					{ label: 'A/R Aging Detail', value: 'AgedReceivableDetail' },
					{ label: 'A/P Aging Summary', value: 'AgedPayables' },
					{ label: 'A/P Aging Detail', value: 'AgedPayableDetail' },
				],
			},
			defaultValue: 'AgedReceivables',
		}),
		reportDate: Property.DateTime({
			displayName: 'As Of Date',
			description: 'The date to age balances against. Defaults to today if empty.',
			required: false,
		}),
		agingPeriod: Property.Number({
			displayName: 'Days Per Period',
			description: 'Number of days in each aging bucket (e.g. 30).',
			required: false,
		}),
		numPeriods: Property.Number({
			displayName: 'Number of Periods',
			description: 'How many aging buckets to include.',
			required: false,
		}),
	},
	async run(context) {
		const { reportType, reportDate, agingPeriod, numPeriods } = context.propsValue;
		const companyId = context.auth.props?.['companyId'];

		if (!companyId) {
			throw new Error('Realm ID not found in authentication data. Please reconnect your account.');
		}

		const apiUrl = quickbooksCommon.getApiUrl(companyId as string);

		const response = await httpClient.sendRequest<
			QuickbooksReport & {
				Fault?: { Error: { Message: string; Detail?: string; code: string }[]; type: string };
			}
		>({
			method: HttpMethod.GET,
			url: `${apiUrl}/reports/${reportType}`,
			queryParams: {
				minorversion: '70',
				...(reportDate && { report_date: reportDate.split('T')[0] }),
				...(agingPeriod != null && { aging_period: String(agingPeriod) }),
				...(numPeriods != null && { num_periods: String(numPeriods) }),
			},
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
			headers: {
				Accept: 'application/json',
			},
		});

		if (response.body.Fault) {
			throw new Error(
				`QuickBooks API Error fetching report: ${response.body.Fault.Error.map(
					(e: { Message: string }) => e.Message,
				).join(', ')}`,
			);
		}

		return response.body;
	},
});
