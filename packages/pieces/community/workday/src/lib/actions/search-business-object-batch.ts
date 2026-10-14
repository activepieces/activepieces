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
			'Pages through a Workday business object collection and returns every matching record, after selecting the module (Recruiting, Onboarding, or HR Services & Time Tracking) and an object type such as Job Requisition, Candidate, or Worker, or supplying a custom REST path instead. Optional JSON query parameters narrow the results; omitting them returns all records of that type. Use to find records by criteria, and Get Business Object Details (Batch) when the IDs are already known. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		module: workdayProps.module({ required: true }),
		businessObject: workdayProps.businessObject({ required: true }),
		queryParams: Property.Json({
			displayName: 'Query Parameters (JSON)',
			description: 'Optional REST query parameters, e.g. `{ "limit": 50, "status": "Open" }`.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const businessObject = workdayUtils.resolveBusinessObject({
			module: propsValue.module,
			selection: propsValue.businessObject,
		});
		const module = workdayUtils.toWorkdayModule({ module: propsValue.module });

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
