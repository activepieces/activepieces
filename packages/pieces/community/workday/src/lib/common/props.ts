import {
	AppConnectionType,
	DropdownState,
	DynamicPropsValue,
	Property,
} from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from './api';
import { workdayUtils } from './utils';

function module<R extends boolean>({
	required,
	displayName = 'Module',
	description = 'Workday functional area: Recruiting, Onboarding, or HR Services & Time Tracking.',
}: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: MODULE_OPTIONS,
		},
	});
}

function source<R extends boolean>({
	required,
	displayName = 'Source',
	description = 'Workday Web Services (SOAP) reaches every object in the list and needs ISU credentials on the connection. REST covers fewer objects.',
}: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		defaultValue: 'wws',
		options: {
			disabled: false,
			options: [
				{ label: 'Workday Web Services (SOAP)', value: 'wws' },
				{ label: 'REST', value: 'rest' },
			],
		},
	});
}

function businessObject<R extends boolean>({
	required,
	displayName = 'Business Object',
	description,
	changeTrackingOnly = false,
}: PropParams<R> & { changeTrackingOnly?: boolean }) {
	return Property.DynamicProperties({
		displayName,
		description,
		required,
		refreshers: ['source', 'module'],
		auth: workdayAuth,
		props: async ({ source, module }): Promise<DynamicPropsValue> => {
			if (source === 'wws') {
				return {
					objectType: soapBusinessObjectType({ changeTrackingOnly }),
				};
			}
			if (typeof module !== 'string' || !module) {
				return {
					objectType: Property.ShortText({
						displayName: 'Business Object',
						description: 'Select a module first.',
						required: true,
					}),
					customPath: customBusinessObjectPath(),
					customService: customService(),
				};
			}
			return {
				objectType: businessObjectType({ module }),
				customPath: customBusinessObjectPath(),
				customService: customService(),
			};
		},
	});
}

function customObjectDefinition<R extends boolean>({
	required,
	displayName = 'Custom Object Definition',
	description = 'The custom object definition; its value is the definition alias, e.g. `apTestInfo`.',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: workdayAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Connect your Workday account first.' });
			}
			if (auth.type === AppConnectionType.CUSTOM_AUTH) {
				return disabledOptions({ placeholder: 'Custom objects need the OAuth 2.0 connection.' });
			}
			const definitions = await workdayApi.listCustomObjectDefinitions({ auth });
			return {
				disabled: false,
				options: definitions.map((definition) => ({
					label: String(definition['name'] ?? definition['descriptor'] ?? definition['alias']),
					value: String(definition['alias']),
				})),
			};
		},
	});
}

function reportId<R extends boolean>({
	required,
	displayName = 'Report',
	description = "The custom report's RaaS URL (on the report: Actions → Web Service → View URLs, copy the JSON link) or `owner/report_name`, e.g. `lmcneil/PT_Workers`. The report must have Enable As Web Service ticked. Prompt values in a pasted URL are kept.",
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function reportParameters<R extends boolean>({
	required,
	displayName = 'Report Prompts (JSON)',
	description = 'Prompt values keyed by the prompt XML alias, e.g. `{ "Start_Date": "2026-10-01", "Organizations!WID": "<WID>" }`. A list is sent as multiple values. These override prompts in a pasted URL.',
}: PropParams<R>) {
	return Property.Json({ displayName, description, required });
}

function wqlQuery<R extends boolean>({
	required,
	displayName = 'WQL Query',
	description = 'Workday Query Language query. Include a date/timestamp column for polling triggers.',
}: PropParams<R>) {
	return Property.LongText({ displayName, description, required });
}

function dateField<R extends boolean>({
	required,
	displayName = 'Date Field Name',
	description = 'Field used to detect new/updated records (e.g. `lastFunctionallyUpdated`).',
}: PropParams<R>) {
	return Property.ShortText({
		displayName,
		description,
		required,
		defaultValue: 'lastFunctionallyUpdated',
	});
}

function requestBody<R extends boolean>({
	required,
	displayName = 'Request Body (JSON)',
	description = 'JSON payload for create or update operations.',
}: PropParams<R>) {
	return Property.Json({ displayName, description, required });
}

function businessObjectType({ module }: { module: string }) {
	const moduleObjects = workdayUtils.businessObjectsForModule({ module });
	return Property.StaticDropdown({
		displayName: 'Business Object',
		description: 'Workday business object to work with.',
		required: true,
		options: {
			disabled: false,
			options: [
				...moduleObjects.map((item) => ({
					label: item.label,
					value: item.value,
				})),
				{ label: 'Custom object (path below)', value: '__custom__' },
			],
		},
	});
}

function soapBusinessObjectType({ changeTrackingOnly }: { changeTrackingOnly: boolean }) {
	return Property.StaticDropdown({
		displayName: 'Business Object',
		description: changeTrackingOnly
			? 'Workday business object to watch. Only objects whose changes Workday tracks are listed.'
			: 'Workday business object to work with.',
		required: true,
		options: {
			disabled: false,
			options: workdayUtils
				.soapObjects({ transactionLogOnly: changeTrackingOnly })
				.map((item) => ({ label: item.label, value: item.value })),
		},
	});
}

function customBusinessObjectPath() {
	return Property.ShortText({
		displayName: 'Custom Business Object Path',
		description:
			'REST path segment when using a custom object, e.g. `/jobPostings` with the Recruiting (v4) service.',
		required: false,
	});
}

function customService() {
	return Property.StaticDropdown({
		displayName: 'Custom API Service',
		description: 'API service prefix for custom business object paths.',
		required: false,
		options: {
			disabled: false,
			options: [
				{ label: 'Common (v1)', value: 'v1' },
				{ label: 'Staffing (v6)', value: 'staffing/v6' },
				{ label: 'Recruiting (v4)', value: 'recruiting/v4' },
				{ label: 'Time Tracking (v7)', value: 'timeTracking/v7' },
				{ label: 'Expense Management', value: 'expense/v1' },
				{ label: 'Procurement (v5)', value: 'procurement/v5' },
				{ label: 'Accounts Payable (v1)', value: 'accountsPayable/v1' },
			],
		},
	});
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
	return { disabled: true, options: [], placeholder };
}

export const workdayProps = {
	source,
	module,
	businessObject,
	customObjectDefinition,
	reportId,
	reportParameters,
	wqlQuery,
	dateField,
	requestBody,
};

const MODULE_OPTIONS = [
	{ label: 'Recruiting', value: 'recruiting' },
	{ label: 'Onboarding', value: 'onboarding' },
	{ label: 'HR Services & Time Tracking', value: 'hr_services_time_tracking' },
];

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
