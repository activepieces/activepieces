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

		const records: Record<string, unknown>[] = [];
		for (const id of ids) {
			const response = await workdayRequest<Record<string, unknown>>(
				auth,
				HttpMethod.GET,
				`${businessObjectConfig.path}/${id}`,
				undefined,
				undefined,
				businessObjectConfig.service,
			);
			records.push(formatWorkdayOutput(response.body, module));
		}

		return {
			total_count: records.length,
			records,
		};
	},
});
