import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdayListCustomObjectDefinitions } from './index';
import {
	businessObjectPropertyForModule,
	customBusinessObjectProperty,
	customServiceProperty,
	moduleProperty,
} from './modules';

export const sharedModuleProps = {
	module: moduleProperty,
	businessObject: Property.DynamicProperties({
		displayName: 'Business Object',
		required: true,
		refreshers: ['module'],
		auth: workdayAuth,
		props: async ({ module }): Promise<DynamicPropsValue> => {
			if (!module) {
				return {
					objectType: Property.ShortText({
						displayName: 'Business Object',
						description: 'Select a module first.',
						required: true,
					}),
					customPath: customBusinessObjectProperty,
					customService: customServiceProperty,
				};
			}
			return {
				objectType: businessObjectPropertyForModule(module as unknown as string),
				customPath: customBusinessObjectProperty,
				customService: customServiceProperty,
			};
		},
	}),
};

export const optionalQueryParamsProperty = Property.Json({
	displayName: 'Query Parameters (JSON)',
	description:
		'Optional REST query parameters, e.g. `{ "limit": 50, "status": "Open" }`.',
	required: false,
});

export const requestBodyProperty = Property.Json({
	displayName: 'Request Body (JSON)',
	description: 'JSON payload for create or update operations.',
	required: true,
});

export const wqlQueryProperty = Property.LongText({
	displayName: 'WQL Query',
	description:
		'Workday Query Language query. Include a date/timestamp column for polling triggers.',
	required: true,
});

export const reportIdProperty = Property.ShortText({
	displayName: 'Report',
	description:
		"The custom report's RaaS URL (on the report: Actions → Web Service → View URLs, copy the JSON link) or `owner/report_name`, e.g. `lmcneil/PT_Workers`. The report must have Enable As Web Service ticked. Prompt values in a pasted URL are kept.",
	required: true,
});

export const reportParametersProperty = Property.Json({
	displayName: 'Report Prompts (JSON)',
	description:
		'Prompt values keyed by the prompt XML alias, e.g. `{ "Start_Date": "2026-10-01", "Organizations!WID": "<WID>" }`. A list is sent as multiple values. These override prompts in a pasted URL.',
	required: false,
});

export const dateFieldProperty = Property.ShortText({
	displayName: 'Date Field Name',
	description:
		'Field used to detect new/updated records (e.g. `lastFunctionallyUpdated`).',
	required: false,
	defaultValue: 'lastFunctionallyUpdated',
});

export const customObjectDefinitionProperty = Property.Dropdown({
	auth: workdayAuth,
	displayName: 'Custom Object Definition',
	description: 'The custom object definition; its value is the definition alias, e.g. `apTestInfo`.',
	required: true,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return { disabled: true, options: [], placeholder: 'Connect your Workday account first.' };
		}
		const definitions = await workdayListCustomObjectDefinitions(auth);
		return {
			disabled: false,
			options: definitions.map((definition) => ({
				label: String(definition['name'] ?? definition['descriptor'] ?? definition['alias']),
				value: String(definition['alias']),
			})),
		};
	},
});

export const operationNameProperty = Property.ShortText({
	displayName: 'Operation Name',
	description:
		'REST sub-resource or SOAP operation path, e.g. `/jobRequisitions/{id}/close` or `Submit_Job_Requisition`.',
	required: true,
});

export const objectIdsProperty = Property.Array({
	displayName: 'Object IDs',
	description: 'One or more Workday record IDs to retrieve.',
	required: true,
	properties: {
		id: Property.ShortText({
			displayName: 'ID',
			required: true,
		}),
	},
});
