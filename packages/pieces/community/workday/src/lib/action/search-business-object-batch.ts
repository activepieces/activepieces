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
