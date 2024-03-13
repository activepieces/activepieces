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
		pipeline: Property.Dropdown({
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
		dealstage: Property.Dropdown({
			displayName: 'Deal Stage',
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
				console.log('DEAL STAGES');
				console.log(response.body.results[0].stages);
				return {
					disabled: false,
					options: response.body.results[0].stages.map((stage) => {
						return {
							label: stage.label,
							value: stage.id,
						};
					}),
				};
			},
		}),
		amount: Property.Number({
			displayName: 'Amount',
			required: false,
		}),
		closedate: Property.DateTime({
			displayName: 'Close Date',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Deal Description',
			required: false,
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
						switch (
							property.fieldType
							// case 'booleancheckbox':
							//     fields[property.name]=Property.StaticDropdown({

							//     })
						) {
						}
					}
				}
				return fields;
			},
		}),
	},
	async run(context) {
		const request: HttpRequest = {
			method: HttpMethod.POST,
			url: 'https://api.hubapi.com/crm/v3/objects/deals',
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
			body: {
				properties: {
					amount: context.propsValue.amount,
					dealname: context.propsValue.dealname,
					pipeline: context.propsValue.pipeline,
					closedate: context.propsValue.closedate,
					dealstage: context.propsValue.dealstage,
					hubspot_owner_id: context.propsValue.hubspot_owner_id,
				},
			},
		};
		const response = await httpClient.sendRequest(request);
		return response.body;
	},
});

function isRelevantProperty(property: PropertyResponse) {
	return !(
		property.modificationMetadata.readOnlyValue ||
		property.hidden ||
		['dealname', 'pipeline', 'amount', 'closedate', 'dealstage', 'hubspot_owner_id'].includes(
			property.name,
		)
	);
}
