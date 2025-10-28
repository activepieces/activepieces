import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { BeehiivPaginatedApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const publicationId = Property.Dropdown({
	displayName: 'Publication',
	refreshers: [],
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account first.',
			};
		}

		const response = await BeehiivPaginatedApiCall<{ id: string; name: string }>({
			apiKey: auth as string,
			method: HttpMethod.GET,
			resourceUri: '/publications',
		});

		return {
			disabled: false,
			options: response.map((publication) => {
				return {
					label: publication.name,
					value: publication.id,
				};
			}),
		};
	},
});

export const subscriptionId =(isRequired=false)=> Property.Dropdown({
	displayName: 'Subscription ID',
	refreshers: ['publicationId'],
	required: isRequired,
	options: async ({ auth, publicationId }) => {
		if (!auth || !publicationId) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account first.',
			};
		}

		const response = await BeehiivPaginatedApiCall<{ id: string; email: string }>({
			apiKey: auth as string,
			method: HttpMethod.GET,
			resourceUri: `/publications/${publicationId}/subscriptions`,
		});

		return {
			disabled: false,
			options: response.map((subscription) => {
				return {
					label: subscription.email,
					value: subscription.id,
				};
			}),
		};
	},
});

export const automationId = (
	displayName: string,
	desc: string,
	isRequired = false,
	isSingleSelect = true,
) => {
	const fieldType = isSingleSelect ? Property.Dropdown : Property.MultiSelectDropdown;
	return fieldType({
		displayName,
		description: desc,
		refreshers: ['publicationId'],
		required: isRequired,
		options: async ({ auth, publicationId }) => {
			if (!auth || !publicationId) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account first.',
				};
			}

			const response = await BeehiivPaginatedApiCall<{ id: string; name: string; status: string }>({
				apiKey: auth as string,
				method: HttpMethod.GET,
				resourceUri: `/publications/${publicationId}/automations`,
			});

			return {
				disabled: false,
				options: response
					.filter((automation) => automation.status !== 'inactive')
					.map((automation) => {
						return {
							label: automation.name,
							value: automation.id,
						};
					}),
			};
		},
	});
};

export const customFields = Property.DynamicProperties({
	displayName: 'Custom Fields',
	refreshers: ['publicationId'],
	required: false,
	props: async ({ auth, publicationId }) => {
		if (!auth || !publicationId) return {};

		const fields: DynamicPropsValue = {};

		const response = await BeehiivPaginatedApiCall<{ id: string; kind: string; display: string }>({
			apiKey: auth as unknown as string,
			method: HttpMethod.GET,
			resourceUri: `/publications/${publicationId}/custom_fields`,
		});

		for (const field of response) {
			switch (field.kind) {
				case 'string':
					fields[field.display] = Property.ShortText({
						displayName: field.display,
						required: false,
					});
					break;
				case 'integer':
					fields[field.display] = Property.Number({
						displayName: field.display,
						required: false,
					});
					break;
				case 'boolean':
					fields[field.display] = Property.Checkbox({
						displayName: field.display,
						required: false,
					});
					break;
				case 'date':
				case 'datetime':
					fields[field.display] = Property.DateTime({
						displayName: field.display,
						required: false,
					});
					break;
				case 'list':
					fields[field.display] = Property.Array({
						displayName: field.display,
						required: false,
					});
					break;
				default:
					break;
			}
		}

		return fields;
	},
});
