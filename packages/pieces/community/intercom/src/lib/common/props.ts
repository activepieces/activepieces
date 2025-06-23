import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { intercomClient } from '.';
import { intercomAuth } from '../../index';
import {
	DropdownOption,
	DynamicPropsValue,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';

export const conversationIdProp = (displayName: string, required = true) =>
	Property.Dropdown({
		displayName,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					options: [],
					disabled: true,
					placeholder: 'Please connect your account first.',
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof intercomAuth>;
			const client = intercomClient(authValue);

			const response = await client.conversations.list();
			const options: DropdownOption<string>[] = [];

			for await (const conversation of response) {
				options.push({
					value: conversation.id,
					label: `${conversation.source.author.email}${
						conversation.title ? `, ${conversation.title}` : ''
					}, ${conversation.id}`,
				});
			}

			return {
				disabled: false,
				options,
			};
		},
	});

export const tagIdProp = (displayName: string, required = true) =>
	Property.Dropdown({
		displayName,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					options: [],
					disabled: true,
					placeholder: 'Please connect your account first.',
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof intercomAuth>;
			const client = intercomClient(authValue);

			const response = await client.tags.list();
			const options: DropdownOption<string>[] = [];

			for (const tag of response.data) {
				options.push({
					value: tag.id,
					label: tag.name,
				});
			}

			return {
				disabled: false,
				options,
			};
		},
	});

export const companyIdProp = (displayName: string, required = true) =>
	Property.Dropdown({
		displayName,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					options: [],
					disabled: true,
					placeholder: 'Please connect your account first.',
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof intercomAuth>;
			const client = intercomClient(authValue);

			const response = await client.companies.list();
			const options: DropdownOption<string>[] = [];

			for await (const company of response) {
				options.push({
					value: company.id,
					label: company.name,
				});
			}

			return {
				disabled: false,
				options,
			};
		},
	});

export const contactIdProp = (displayName: string, contactType: string | null, required = true) =>
	Property.Dropdown({
		displayName,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					options: [],
					disabled: true,
					placeholder: 'Please connect your account first.',
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof intercomAuth>;
			const client = intercomClient(authValue);

			const response = await client.contacts.list();
			const options: DropdownOption<string>[] = [];

			for await (const contact of response) {
				if (contactType === null || contact.role === contactType) {
					options.push({
						value: contact.id,
						label: `${contact.name ?? ''}, ${contact.email}, ${contact.external_id ?? ''}`,
					});
				}
			}

			return {
				disabled: false,
				options,
			};
		},
	});

export const collectionIdProp = (displayName: string, required = true) =>
	Property.Dropdown({
		displayName,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					options: [],
					disabled: true,
					placeholder: 'Please connect your account first.',
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof intercomAuth>;
			const client = intercomClient(authValue);

			const response = await client.helpCenters.collections.list();
			const options: DropdownOption<string>[] = [];

			for await (const collection of response) {
				options.push({
					value: collection.id,
					label: collection.name,
				});
			}

			return {
				disabled: false,
				options,
			};
		},
	});

export const ticketTypeIdProp = (displayName: string, required = true) =>
	Property.Dropdown({
		displayName,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					options: [],
					disabled: true,
					placeholder: 'Please connect your account first.',
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof intercomAuth>;
			const response = await httpClient.sendRequest<{ data: Array<{ id: string; name: string }> }>({
				method: HttpMethod.GET,
				url: `https://api.${authValue.props?.['region']}.io/ticket_types `,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: authValue.access_token,
				},
			});

			const options: DropdownOption<string>[] = [];

			for (const type of response.body.data) {
				options.push({
					value: type.id,
					label: type.name,
				});
			}

			return {
				disabled: false,
				options,
			};
		},
	});

export const ticketStateIdProp = (displayName: string, required = true) =>
	Property.Dropdown({
		displayName,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					options: [],
					disabled: true,
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof intercomAuth>;

			const options: DropdownOption<string>[] = [];

			const response = await httpClient.sendRequest<{
				data: Array<{ id: string; internal_label: string }>;
			}>({
				method: HttpMethod.GET,
				url: `https://api.${authValue.props?.['region']}.io/ticket_states`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: authValue.access_token,
				},
			});

			if (response.body.data) {
				for (const state of response.body.data) {
					options.push({
						label: state.internal_label,
						value: state.id,
					});
				}
			}

			return {
				disabled: true,
				options: [],
			};
		},
	});

export const ticketIdProp = (displayName: string, required = true) =>
	Property.Dropdown({
		displayName,
		required,
		refreshers: ['ticketTypeId'],
		options: async ({ auth, ticketTypeId }) => {
			if (!auth || !ticketTypeId) {
				return {
					options: [],
					disabled: true,
					placeholder: 'Please connect your account first.',
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof intercomAuth>;
			const client = intercomClient(authValue);

			const options: DropdownOption<string>[] = [];

			const response = await client.tickets.search({
				query: {
					field: 'ticket_type_id',
					operator: '=',
					value: ticketTypeId as unknown as string,
				},
				pagination: { per_page: 100 },
			});

			for await (const ticket of response) {
				options.push({
					value: ticket.id,
					label: (ticket.ticket_attributes['_default_title_'] as string) ?? ticket.id,
				});
			}

			return {
				disabled: false,
				options,
			};
		},
	});

export const ticketPropertiesProp = (displayName: string, required = true) =>
	Property.DynamicProperties({
		displayName,
		refreshers: ['ticketTypeId'],
		required,
		props: async ({ auth, ticketTypeId }) => {
			if (!auth) return {};
			if (!ticketTypeId) return {};

			const props: DynamicPropsValue = {};

			const authValue = auth as PiecePropValueSchema<typeof intercomAuth>;

			const response = await httpClient.sendRequest<{
				ticket_type_attributes: {
					data: Array<{ data_type: string; name: string; input_options: Record<string, unknown> }>;
				};
			}>({
				method: HttpMethod.GET,
				url: `https://api.${authValue.props?.['region']}.io/ticket_types/${ticketTypeId} `,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: authValue.access_token,
				},
			});

			for (const field of response.body.ticket_type_attributes.data) {
				switch (field.data_type) {
					case 'string':
						props[field.name] = Property.LongText({
							displayName:
								field.name === '_default_title_'
									? 'Title (Default)'
									: field.name === '_default_description_'
									? 'Description (Default)'
									: field.name,
							required: false,
						});
						break;
					case 'integer':
					case 'decimal':
						props[field.name] = Property.Number({
							displayName: field.name,
							required: false,
						});
						break;
					case 'boolean':
						props[field.name] = Property.Checkbox({
							displayName: field.name,
							required: false,
						});
						break;
					case 'datetime':
						props[field.name] = Property.DateTime({
							displayName: field.name,
							required: false,
						});
						break;
					case 'list':
						{
							const options = field.input_options.list_options as Array<{
								label: string;
								id: string;
							}>;

							props[field.name] = Property.StaticDropdown({
								displayName: field.name,
								required: false,
								options: {
									disabled: false,
									options: options
										? options.map((option) => ({
												value: option.id,
												label: option.label,
										  }))
										: [],
								},
							});
						}

						break;
					default:
						break;
				}
			}

			return props;
		},
	});
