import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';
import { workdayProps } from '../common/props';
import { workdayUtils } from '../common/utils';

export const getBusinessObjectDetailsBatchAction = createAction({
	auth: workdayAuth,
	name: 'get_business_object_details_batch',
	classification: 'READ',
	displayName: 'Get Business Object Details (Batch)',
	description: 'Retrieves details for one or more business objects by ID in a single step.',
	audience: 'both',
	aiMetadata: {
		description:
			'Fetches the full record for one or more Workday business objects by ID in a single step, after selecting the module (Recruiting, Onboarding, or HR Services & Time Tracking) and an object type such as Job Requisition, Candidate, or Worker, or supplying a custom REST path instead. Use when the record IDs are already known; use Search Business Object (Batch) to find records by criteria. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		module: workdayProps.module({ required: true }),
		businessObject: workdayProps.businessObject({ required: true }),
		objectIds: Property.Array({
			displayName: 'Object IDs',
			description: 'One or more Workday record IDs to retrieve.',
			required: true,
			properties: {
				id: Property.ShortText({
					displayName: 'ID',
					required: true,
				}),
			},
		}),
	},
	async run({ auth, propsValue }) {
		const businessObject = workdayUtils.resolveBusinessObject({
			module: propsValue.module,
			selection: propsValue.businessObject,
		});
		const module = workdayUtils.toWorkdayModule({ module: propsValue.module });
		const ids = propsValue.objectIds.flatMap((item) =>
			typeof item === 'object' && item !== null && 'id' in item ? [String(item.id)] : [],
		);

		const records = await Promise.all(
			ids.map(async (id) => {
				const record = await workdayApi.getBusinessObject({ auth, businessObject, objectId: id });
				return workdayUtils.formatOutput({ record, module });
			}),
		);

		return {
			total_count: records.length,
			records,
		};
	},
});
