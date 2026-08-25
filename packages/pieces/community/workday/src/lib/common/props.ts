import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
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
	displayName: 'Report ID or Alias',
	description: 'Workday report ID or web service alias from the report definition.',
	required: true,
});

export const dateFieldProperty = Property.ShortText({
	displayName: 'Date Field Name',
	description:
		'Field used to detect new/updated records (e.g. `lastFunctionallyUpdated`).',
	required: false,
	defaultValue: 'lastFunctionallyUpdated',
});

export const customObjectDefinitionProperty = Property.ShortText({
	displayName: 'Custom Object Definition ID',
	description: 'Custom object definition alias or ID from Workday.',
	required: true,
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
