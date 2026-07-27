import { createAction } from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import { workdayAuth } from '../auth';
import { fetchAllPages } from '../common';
import { formatWorkdayOutputs } from '../common/fields';
import { resolveBusinessObject, toWorkdayModule } from '../common/modules';
import { optionalQueryParamsProperty, sharedModuleProps } from '../common/props';

export const searchBusinessObjectBatch = createAction({
	auth: workdayAuth,
	name: 'search_business_object_batch',
	displayName: 'Search Business Object (Batch)',
	description:
		'Searches business objects with pagination and returns all matching records.',
	audience: 'both',
	aiMetadata: {
		description:
			'Pages through a Workday business object collection and returns every matching record, after selecting the module (Recruiting, Onboarding, or HR Services & Time Tracking) and an object type such as Job Requisition, Candidate, or Worker, or supplying a custom REST path instead. Optional JSON query parameters narrow the results; omitting them returns all records of that type. Use to find records by criteria, and Get Business Object Details (Batch) when the IDs are already known. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		...sharedModuleProps,
		queryParams: optionalQueryParamsProperty,
	},
	async run({ auth, propsValue }) {
		const bo = propsValue.businessObject as {
			objectType?: string;
			customPath?: string;
			customService?: string;
		};
		const businessObjectConfig = resolveBusinessObject(
			propsValue.module,
			bo.objectType,
			bo.customPath,
			bo.customService,
		);
		const module = toWorkdayModule(propsValue.module);
		const queryParams = (propsValue.queryParams as QueryParams) ?? {};

		const records = await fetchAllPages<Record<string, unknown>>(
			auth,
			businessObjectConfig.path,
			queryParams,
			'data',
			businessObjectConfig.service,
		);
		const formatted = formatWorkdayOutputs(records, module);

		return {
			total_count: formatted.length,
			records: formatted,
		};
	},
});
