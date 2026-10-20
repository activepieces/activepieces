import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';
import { workdayProps } from '../common/props';
import { workdayUtils } from '../common/utils';

export const updateBusinessObjectAction = createAction({
	auth: workdayAuth,
	name: 'update_business_object',
	classification: 'WRITE',
	displayName: 'Update Business Object',
	description: 'Updates an existing business object by ID using the REST API.',
	audience: 'both',
	aiMetadata: {
		description:
			'Updates one existing Workday business object by its ID, sending the new field values as a JSON body, after selecting the module (Recruiting, Onboarding, or HR Services & Time Tracking) and an object type (Worker, Case, or Time Entry), or supplying a custom REST path instead. Use for generic edits to worker, case, or time-entry records, and prefer the dedicated action (e.g. Update Supplier, Change Job) when one exists. Requires the record ID and a JSON body. Idempotent: keyed on the object ID, so re-sending the same body converges to the same state.',
		idempotent: true,
	},
	props: {
		module: workdayProps.module({ required: true }),
		businessObject: workdayProps.businessObject({ required: true }),
		objectId: Property.ShortText({
			displayName: 'Object ID',
			description: 'Workday ID of the record to update.',
			required: true,
		}),
		body: workdayProps.requestBody({ required: true }),
	},
	async run({ auth, propsValue }) {
		const businessObject = workdayUtils.resolveBusinessObject({
			module: propsValue.module,
			selection: propsValue.businessObject,
		});
		const module = workdayUtils.toWorkdayModule({ module: propsValue.module });
		const body =
			typeof propsValue.body === 'string' ? JSON.parse(propsValue.body) : propsValue.body;

		const record = await workdayApi.updateBusinessObject({
			auth,
			businessObject,
			objectId: propsValue.objectId,
			body,
		});
		return workdayUtils.formatOutput({ record, module });
	},
});
