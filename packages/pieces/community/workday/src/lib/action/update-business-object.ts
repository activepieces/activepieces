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
