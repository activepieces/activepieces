import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';
import { workdayProps } from '../common/props';
import { workdayUtils } from '../common/utils';

export const searchBusinessObjectBatchAction = createAction({
	auth: workdayAuth,
	name: 'search_business_object_batch',
	classification: 'SEARCH',
	displayName: 'Search Business Object (Batch)',
	description: 'Searches business objects with pagination and returns all matching records.',
	audience: 'both',
	aiMetadata: {
		description:
			"Pages through a Workday business object collection and returns every matching record, for one object type. With the SOAP source (the default, needs ISU credentials) it lists records of Worker, Organization, Job Profile, Location, Job Family, Job Family Group, Job Classification Group, Position, Worker Document, Citizenship Status, Job Requisition, Evergreen Requisition, Applicant, or Customer Contract, up to the Limit (default 100, max 1000); Payees can only be fetched by ID with Get Business Object Details. With the REST source it pages a module's Worker, Case, or Time Entry collection or a custom REST path, and optional JSON query parameters narrow the results. Use to find records by criteria, and Get Business Object Details (Batch) when the IDs are already known. Read-only and idempotent.",
		idempotent: true,
	},
	props: {
		source: workdayProps.source({ required: false }),
		module: workdayProps.module({
			required: false,
			description:
				'Workday functional area: Recruiting, Onboarding, or HR Services & Time Tracking. Only used with the REST source.',
		}),
		businessObject: workdayProps.businessObject({ required: true }),
		limit: Property.Number({
			displayName: 'Limit',
			description:
				'Maximum number of records to return with the SOAP source (default 100, max 1000). Workday records are large, so keep this low.',
			required: false,
			defaultValue: 100,
		}),
		queryParams: Property.Json({
			displayName: 'Query Parameters (JSON)',
			description:
				'Optional REST query parameters, e.g. `{ "limit": 50, "status": "Open" }`. Only used with the REST source.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		if (propsValue.source === 'wws') {
			const records = await workdayApi.listSoapObjects({
				auth,
				object: workdayUtils.resolveSoapObject({
					value: propsValue.businessObject['objectType'],
				}),
				limit: Math.min(Math.max(propsValue.limit ?? 100, 1), 1000),
			});
			return {
				total_count: records.length,
				records,
			};
		}
		const businessObject = workdayUtils.resolveBusinessObject({
			module: propsValue.module,
			selection: propsValue.businessObject,
		});
		const module = workdayUtils.toWorkdayModule({ module: propsValue.module ?? '' });

		const records = await workdayApi.searchBusinessObjects({
			auth,
			businessObject,
			query: workdayUtils.toQueryParams({ value: propsValue.queryParams }),
		});
		const formatted = workdayUtils.formatOutputs({ records, module });

		return {
			total_count: formatted.length,
			records: formatted,
		};
	},
});
