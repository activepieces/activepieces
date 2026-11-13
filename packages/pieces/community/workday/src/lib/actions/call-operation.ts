import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';
import { workdayProps } from '../common/props';
import { workdayUtils } from '../common/utils';

const SOAP_SERVICES = [
	'Absence_Management',
	'Benefits_Administration',
	'Cash_Management',
	'Compensation',
	'Compensation_Review',
	'Financial_Management',
	'Human_Resources',
	'Identity_Management',
	'Integrations',
	'Learning',
	'Payroll',
	'Payroll_Interface',
	'Performance_Management',
	'Recruiting',
	'Resource_Management',
	'Revenue_Management',
	'Staffing',
	'Talent',
	'Time_Tracking',
	'Workforce_Planning',
];

export const callOperationAction = createAction({
	auth: workdayAuth,
	name: 'call_operation',
	classification: 'WRITE',
	displayName: 'Call Operation',
	description: 'Calls a Workday REST sub-resource or SOAP operation (e.g. approve, close, submit).',
	audience: 'both',
	aiMetadata: {
		description:
			'Invokes a Workday operation that has no dedicated action, in one of two modes: a REST sub-resource call (POST, PUT, or PATCH against a business-object path such as /cases/{id}/reopen) or a raw SOAP operation against a named web service such as Staffing. Use as the escape hatch for verbs like approve, close, or submit, and prefer the specific action (e.g. Approve Task, Update Business Object) whenever one exists. Requires the operation name, plus the SOAP service name when running in SOAP mode. Not idempotent: each call submits the operation as a fresh event.',
		idempotent: false,
	},
	props: {
		module: workdayProps.module({ required: true }),
		businessObject: workdayProps.businessObject({ required: true }),
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
		operationName: Property.ShortText({
			displayName: 'Operation Name',
			description:
				'REST sub-resource or SOAP operation path, e.g. `/cases/{id}/reopen` or `Close_Job_Requisition`.',
			required: true,
		}),
		soapService: Property.StaticDropdown({
			displayName: 'SOAP Service',
			description: 'Workday Web Service that owns the operation. Required for SOAP operations.',
			required: false,
			options: {
				disabled: false,
				options: SOAP_SERVICES.map((service) => ({
					label: service.replace(/_/g, ' '),
					value: service,
				})),
			},
		}),
		soapVersion: Property.ShortText({
			displayName: 'SOAP Version',
			description:
				'Workday Web Services version for this call, e.g. `v45.0`. Leave empty to use the connection version (default v47.0).',
			required: false,
		}),
		httpMethod: Property.StaticDropdown<HttpMethod, false>({
			displayName: 'HTTP Method',
			required: false,
			defaultValue: HttpMethod.POST,
			options: {
				disabled: false,
				options: [
					{ label: 'POST', value: HttpMethod.POST },
					{ label: 'PUT', value: HttpMethod.PUT },
					{ label: 'PATCH', value: HttpMethod.PATCH },
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
				throw new Error('SOAP Service is required for SOAP operations.');
			}
			const xml =
				propsValue.soapBody && propsValue.soapBody.trim().length > 0
					? propsValue.soapBody
					: `<bsvc:${propsValue.operationName} xmlns:bsvc="urn:com.workday/bsvc"/>`;
			const result = await workdayApi.callSoapOperation({
				auth,
				service: propsValue.soapService,
				operationXml: xml,
				version: propsValue.soapVersion,
			});
			return workdayUtils.flattenRecord({ value: result });
		}

		const config = workdayUtils.resolveBusinessObject({
			module: propsValue.module,
			selection: propsValue.businessObject,
		});
		const path = propsValue.operationName.startsWith('/')
			? propsValue.operationName
			: `${config.path}/${propsValue.operationName}`;
		const body =
			propsValue.body && typeof propsValue.body === 'object' ? propsValue.body : undefined;

		const result = await workdayApi.callRestOperation({
			auth,
			method: propsValue.httpMethod ?? HttpMethod.POST,
			path,
			body,
			service: config.service,
		});
		return workdayUtils.flattenRecord({ value: result });
	},
});
