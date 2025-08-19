import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { closePaginatedApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const customFields = (objectType: string) =>
	Property.DynamicProperties({
		displayName: 'Custom Fields',
		refreshers: [],
		required: false,
		props: async ({ auth }) => {
			if (!auth) return {};

			const fields: DynamicPropsValue = {};

			const response = await closePaginatedApiCall<{
				id: string;
				type: string;
				choices?: string[];
				accepts_multiple_values: boolean;
				name: string;
			}>({
				accessToken: auth as unknown as string,
				method: HttpMethod.GET,
				resourceUri: `/custom_field/${objectType}/`,
			});

			for (const field of response) {
				switch (field.type) {
					case 'number':
						fields[field.id] = Property.Number({
							displayName: field.name,
							required: false,
						});
						break;
					case 'text':
						fields[field.id] = Property.ShortText({
							displayName: field.name,
							required: false,
						});
						break;
					case 'textarea':
						fields[field.id] = Property.LongText({
							displayName: field.name,
							required: false,
						});
						break;
					case 'date':
					case 'datetime':
						fields[field.id] = Property.DateTime({
							displayName: field.name,
							required: false,
						});
						break;
					case 'choices': {
						const fieldType = field.accepts_multiple_values
							? Property.StaticMultiSelectDropdown
							: Property.StaticDropdown;
						fields[field.id] = fieldType({
							displayName: field.name,
							required: false,
							options: {
								disabled: false,
								options: field.choices
									? field.choices.map((choice) => ({
											label: choice,
											value: choice,
									  }))
									: [],
							},
						});
						break;
					}

					case 'contact':
					case 'user': {
						const fieldType = field.accepts_multiple_values ? Property.Array : Property.ShortText;
						fields[field.id] = fieldType({
							displayName: field.name,
							required: false,
							description: `Provide ${field.type} ID.`,
						});
						break;
					}
					default:
						break;
				}
			}

			return fields;
		},
	});

export const statusId = (objectType: string, required = false) =>
	Property.Dropdown({
		displayName: 'Status',
		refreshers: [],
		required,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account first.',
				};
			}

			const response = await closePaginatedApiCall<{
				id: string;
				label: string;
			}>({
				accessToken: auth as string,
				method: HttpMethod.GET,
				resourceUri: `/status/${objectType}/`,
			});

			return {
				disabled: false,
				options: response.map((status) => ({
					label: status.label,
					value: status.id,
				})),
			};
		},
	});

export const leadId = (required = false) =>
	Property.Dropdown({
		displayName: 'Lead',
		required,
		refreshers: ['auth'],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please authenticate first.',
				};
			}
			try {
				const response = await closePaginatedApiCall<{
					id: string;
					name: string;
				}>({
					accessToken: auth as string,
					method: HttpMethod.GET,
					resourceUri: '/lead/?_fields=id,name',
				});

				return {
					disabled: false,
					options: response.map((lead) => ({
						label: lead.name,
						value: lead.id,
					})),
				};
			} catch (error) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Could not fetch leads. Check your connection.',
				};
			}
		},
	});

export const userId = (required = false) =>
	Property.Dropdown({
		displayName: 'User',
		required,
		refreshers: ['auth'],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please authenticate first.',
				};
			}
			try {
				const response = await closePaginatedApiCall<{
					id: string;
					email: string;
				}>({
					accessToken: auth as string,
					method: HttpMethod.GET,
					resourceUri: '/user/?_fields=id,email',
				});

				return {
					disabled: false,
					options: response.map((user) => ({
						label: user.email,
						value: user.id,
					})),
				};
			} catch (error) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Could not fetch uers. Check your connection.',
				};
			}
		},
	});
