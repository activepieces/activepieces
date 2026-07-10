import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdayRequest, workdaySoapRequest } from '../common';
import { flattenRecord } from '../common/fields';
import { resolveBusinessObject } from '../common/modules';
import { operationNameProperty, sharedModuleProps } from '../common/props';

export const callOperation = createAction({
	auth: workdayAuth,
	name: 'call_operation',
	displayName: 'Call Operation',
	description:
		'Calls a Workday REST sub-resource or SOAP operation (e.g. approve, close, submit).',
	props: {
		...sharedModuleProps,
		operationType: Property.StaticDropdown({
			displayName: 'Operation Type',
			required: true,
			defaultValue: 'rest',
			options: {
				disabled: false,
				options: [
					{ label: 'REST sub-resource', value: 'rest' },
					{ label: 'SOAP operation', value: 'soap' },
				],
			},
		}),
		operationName: operationNameProperty,
		soapService: Property.ShortText({
			displayName: 'SOAP Service Name',
			description: 'Required for SOAP operations, e.g. `Staffing` or `Human_Resources`.',
			required: false,
		}),
		httpMethod: Property.StaticDropdown({
			displayName: 'HTTP Method',
			required: false,
			defaultValue: 'POST',
			options: {
				disabled: false,
				options: [
					{ label: 'POST', value: 'POST' },
					{ label: 'PUT', value: 'PUT' },
					{ label: 'PATCH', value: 'PATCH' },
				],
			},
		}),
		body: Property.Json({
			displayName: 'Request Body (JSON)',
			description: 'JSON payload for REST operations.',
			required: false,
		}),
		soapBody: Property.LongText({
			displayName: 'SOAP Body (XML)',
			description:
				'Raw SOAP operation XML, used only for SOAP operations. Leave empty to send an empty operation element.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		if (propsValue.operationType === 'soap') {
			if (!propsValue.soapService) {
				throw new Error('SOAP Service Name is required for SOAP operations.');
			}
			const xml =
				propsValue.soapBody && propsValue.soapBody.trim().length > 0
					? propsValue.soapBody
					: `<${propsValue.operationName} xmlns:bsvc="urn:com.workday/bsvc"/>`;
			const result = await workdaySoapRequest(auth, propsValue.soapService, xml);
			return flattenRecord(result);
		}

		const bo = propsValue.businessObject as {
			objectType?: string;
			customPath?: string;
			customService?: string;
		};
		const config = resolveBusinessObject(
			propsValue.module,
			bo.objectType,
			bo.customPath,
			bo.customService,
		);
		const path = propsValue.operationName.startsWith('/')
			? propsValue.operationName
			: `${config.path}/${propsValue.operationName}`;
		const method = (propsValue.httpMethod ?? 'POST') as HttpMethod;
		const body =
			propsValue.body && typeof propsValue.body === 'object'
				? (propsValue.body as Record<string, unknown>)
				: undefined;

		const response = await workdayRequest<Record<string, unknown>>(
			auth,
			method,
			path,
			body,
			undefined,
			config.service,
		);
		return flattenRecord(response.body);
	},
});
