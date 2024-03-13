import {
	AuthenticationType,
	HttpMethod,
	HttpRequest,
	httpClient,
} from '@activepieces/pieces-common';

import { hubspotAuth } from '../../';

import {
	DynamicPropsValue,
	PiecePropValueSchema,
	Property,
	createAction,
} from '@activepieces/pieces-framework';

import {
	ListDealPipelinesResponse,
	ListOwnersResponse,
	ListPipelineStagesResponse,
	ListPropertiesResponse,
	PropertyResponse,
} from '../common/models';

export const createDealAction = createAction({
	auth: hubspotAuth,
	name: 'create_deal',
	displayName: 'Create Deal',
	description: 'Creates a new deal in hubspot.',
	props: {
		dealname: Property.ShortText({
			displayName: 'Deal Name',
			required: true,
		}),
		pipelineId: Property.Dropdown({
			displayName: 'Deal Pipeline',
			refreshers: [],
			required: true,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please connect your account first.',
						options: [],
					};
				}
				const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
				const request: HttpRequest = {
					method: HttpMethod.GET,
					url: 'https://api.hubapi.com/crm/v3/pipelines/deals',
					authentication: {
						type: AuthenticationType.BEARER_TOKEN,
						token: authValue.access_token,
					},
				};
				const response = await httpClient.sendRequest<ListDealPipelinesResponse>(request);
				return {
					disabled: false,
					options: response.body.results.map((pipeline) => {
						return {
							label: pipeline.label,
							value: pipeline.id,
						};
					}),
				};
			},
		}),
		dealstageId: Property.Dropdown({
			displayName: 'Deal Stage',
			refreshers: ['pipelineId'],
			required: true,
			options: async ({ auth, pipelineId }) => {
				if (!auth || !pipelineId) {
					return {
						disabled: true,
						placeholder: 'Please connect your account first and select pipeline.',
						options: [],
					};
				}
				const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
				const request: HttpRequest = {
					method: HttpMethod.GET,
					url: `https://api.hubapi.com/crm/v3/pipelines/deals/${pipelineId}/stages`,
					authentication: {
						type: AuthenticationType.BEARER_TOKEN,
						token: authValue.access_token,
					},
				};
				const response = await httpClient.sendRequest<ListPipelineStagesResponse>(request);
				return {
					disabled: false,
					options: response.body.results.map((stage) => {
						return {
							label: stage.label,
							value: stage.id,
						};
					}),
				};
			},
		}),
		hubspot_owner_id: Property.Dropdown({
			displayName: 'Deal Owner',
			refreshers: [],
			required: false,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please connect your account first.',
						options: [],
					};
				}
				const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
				const request: HttpRequest = {
					method: HttpMethod.GET,
					url: 'https://api.hubapi.com/crm/v3/owners',
					authentication: {
						type: AuthenticationType.BEARER_TOKEN,
						token: authValue.access_token,
					},
				};
				const response = await httpClient.sendRequest<ListOwnersResponse>(request);
				return {
					disabled: false,
					options: response.body.results.map((owner) => {
						return {
							label: owner.email,
							value: owner.id,
						};
					}),
				};
			},
		}),
		additionalFields: Property.DynamicProperties({
			displayName: 'Additional Fields',
			refreshers: [],
			required: true,
			props: async ({ auth }) => {
				if (!auth) return {};

				const fields: DynamicPropsValue = {};
				const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;

				const request: HttpRequest = {
					method: HttpMethod.GET,
					url: 'https://api.hubapi.com/crm/v3/properties/deals',
					authentication: {
						type: AuthenticationType.BEARER_TOKEN,
						token: authValue.access_token,
					},
				};

				const response = await httpClient.sendRequest<ListPropertiesResponse>(request);

				for (const property of response.body.results) {
					if (isRelevantProperty(property)) {
						switch (property.fieldType) {
							case 'booleancheckbox':
							case 'radio':
							case 'select':
								fields[property.name] = Property.StaticDropdown({
									displayName: property.label,
									description: property.description ?? '',
									required: false,
									options: {
										disabled: false,
										options: property.options.map((option) => {
											return {
												label: option.label,
												value: option.value,
											};
										}),
									},
								});
								break;
							case 'checkbox':
								fields[property.name] = Property.StaticMultiSelectDropdown({
									displayName: property.label,
									description: property.description ?? '',
									required: false,
									options: {
										disabled: false,
										options: property.options.map((option) => {
											return {
												label: option.label,
												value: option.value,
											};
										}),
									},
								});
								break;
							case 'date':
								fields[property.name] = Property.DateTime({
									displayName: property.label,
									description: property.description ?? '',
									required: false,
								});
								break;
							case 'file':
								fields[property.name] = Property.File({
									displayName: property.label,
									description: property.description ?? '',
									required: false,
								});
								break;
							case 'text':
							case 'phonenumber':
							case 'html':
								fields[property.name] = Property.ShortText({
									displayName: property.label,
									description: property.description ?? '',
									required: false,
								});
								break;
							case 'textarea':
								fields[property.name] = Property.LongText({
									displayName: property.label,
									description: property.description ?? '',
									required: false,
								});
								break;
							default:
								break;
						}
					}
				}
				return fields;
			},
		}),
	},
	async run(context) {
		const additionalFields = context.propsValue.additionalFields;
		const properties: DynamicPropsValue = {};
		Object.entries(additionalFields).forEach(([key, value]) => {
			if (Array.isArray(value)) {
				properties[key] = value.join(';');
			} else {
				properties[key] = value;
			}
		});
		const request: HttpRequest = {
			method: HttpMethod.POST,
			url: 'https://api.hubapi.com/crm/v3/objects/deals',
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
			body: {
				properties: {
					dealname: context.propsValue.dealname,
					pipeline: context.propsValue.pipelineId,
					dealstage: context.propsValue.dealstageId,
					hubspot_owner_id: context.propsValue.hubspot_owner_id,
					...properties,
				},
			},
		};
		const response = await httpClient.sendRequest(request);
		return response.body;
	},
});

function isRelevantProperty(property: PropertyResponse) {
	return (
		!property.modificationMetadata.readOnlyValue &&
		!property.hidden &&
		!property.externalOptions &&
		!['dealname', 'pipeline', 'dealstage', 'hubspot_owner_id'].includes(property.name)
	);
}
