import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdayRequest } from '../common';
import { formatWorkdayOutput } from '../common/fields';
import { resolveBusinessObject, toWorkdayModule } from '../common/modules';
import { requestBodyProperty, sharedModuleProps } from '../common/props';

export const updateBusinessObject = createAction({
	auth: workdayAuth,
	name: 'update_business_object',
	displayName: 'Update Business Object',
	description: 'Updates an existing business object by ID using the REST API.',
	audience: 'both',
	aiMetadata: {
		description:
			'Updates one existing Workday business object by its ID, sending the new field values as a JSON body, after selecting the module (Recruiting, Onboarding, or HR Services & Time Tracking) and an object type such as Job Requisition, Candidate, or Worker, or supplying a custom REST path instead. Use for generic edits to recruiting, onboarding, or HR and time-tracking records, and prefer the dedicated action (e.g. Update Supplier, Change Job) when one exists. Requires the record ID and a JSON body. Idempotent: keyed on the object ID, so re-sending the same body converges to the same state.',
		idempotent: true,
	},
	props: {
		...sharedModuleProps,
		objectId: Property.ShortText({
			displayName: 'Object ID',
			description: 'Workday ID of the record to update.',
			required: true,
		}),
		body: requestBodyProperty,
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
		const body =
			typeof propsValue.body === 'string'
				? JSON.parse(propsValue.body)
				: propsValue.body;

		const response = await workdayRequest<Record<string, unknown>>(
			auth,
			HttpMethod.PUT,
			`${businessObjectConfig.path}/${propsValue.objectId}`,
			body,
			undefined,
			businessObjectConfig.service,
		);
		return formatWorkdayOutput(response.body, module);
	},
});
