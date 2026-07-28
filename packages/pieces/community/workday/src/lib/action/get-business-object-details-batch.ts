import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdayRequest } from '../common';
import { formatWorkdayOutput } from '../common/fields';
import { resolveBusinessObject, toWorkdayModule } from '../common/modules';
import { objectIdsProperty, sharedModuleProps } from '../common/props';

export const getBusinessObjectDetailsBatch = createAction({
	auth: workdayAuth,
	name: 'get_business_object_details_batch',
	displayName: 'Get Business Object Details (Batch)',
	description:
		'Retrieves details for one or more business objects by ID in a single step.',
	audience: 'both',
	aiMetadata: {
		description:
			'Fetches the full record for one or more Workday business objects by ID in a single step, after selecting the module (Recruiting, Onboarding, or HR Services & Time Tracking) and an object type such as Job Requisition, Candidate, or Worker, or supplying a custom REST path instead. Use when the record IDs are already known; use Search Business Object (Batch) to find records by criteria. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		...sharedModuleProps,
		objectIds: objectIdsProperty,
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
		const ids = (propsValue.objectIds as Array<{ id: string }>).map(
			(item) => item.id,
		);

		const records = await Promise.all(
			ids.map(async (id) => {
				const response = await workdayRequest<Record<string, unknown>>(
					auth,
					HttpMethod.GET,
					`${businessObjectConfig.path}/${id}`,
					undefined,
					undefined,
					businessObjectConfig.service,
				);
				return formatWorkdayOutput(response.body, module);
			}),
		);

		return {
			total_count: records.length,
			records,
		};
	},
});
