import { activeCampaignAuth } from '../../';
import { DynamicPropsValue, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { ActiveCampaignClient } from './client';
import { CUSTOM_FIELD_TYPE } from './constants';

export function makeClient(auth: PiecePropValueSchema<typeof activeCampaignAuth>) {
	const client = new ActiveCampaignClient(auth.apiUrl, auth.apiKey);
	return client;
}

export const activecampaignCommon = {
	listId: (required = false) =>
		Property.Dropdown({
			displayName: 'List',
			required,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please connect your account first',
						options: [],
					};
				}
				const client = makeClient(auth as PiecePropValueSchema<typeof activeCampaignAuth>);
				const res = await client.listContactLists();

				return {
					disabled: false,
					options: res.lists.map((list) => {
						return {
							label: list.name,
							value: list.id,
						};
					}),
				};
			},
		}),
	accountId: Property.Dropdown({
		displayName: 'Account ID',
		required: true,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please connect your account first',
					options: [],
				};
			}
			const client = makeClient(auth as PiecePropValueSchema<typeof activeCampaignAuth>);
			const res = await client.listAccounts();

			return {
				disabled: false,
				options: res.accounts.map((account) => {
					return {
						label: account.name,
						value: account.id,
					};
				}),
			};
		},
	}),
	contactId: Property.Dropdown({
		displayName: 'Contact ID',
		required: true,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please connect your account first',
					options: [],
				};
			}
			const client = makeClient(auth as PiecePropValueSchema<typeof activeCampaignAuth>);
			const res = await client.listContacts();

			return {
				disabled: false,
				options: res.contacts.map((contact) => {
					return {
						label: `${contact.firstName} ${contact.lastName}` ?? contact.email,
						value: contact.id,
					};
				}),
			};
		},
	}),
	tagId: Property.Dropdown({
		displayName: 'Tag ID',
		required: true,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please connect your account first',
					options: [],
				};
			}
			const client = makeClient(auth as PiecePropValueSchema<typeof activeCampaignAuth>);
			const res = await client.listTags();

			return {
				disabled: false,
				options: res.tags.map((tag) => {
					return {
						label: tag.tag,
						value: tag.id,
					};
				}),
			};
		},
	}),
	accountCustomFields: Property.DynamicProperties({
		displayName: 'Account Custom Fields',
		refreshers: [],
		required: true,
		props: async ({ auth }) => {
			if (!auth) return {};

			const client = makeClient(auth as PiecePropValueSchema<typeof activeCampaignAuth>);
			const res = await client.listAccountCustomFields();

			const fields: DynamicPropsValue = {};

			for (const field of res.accountCustomFieldMeta) {
				switch (field.fieldType) {
					case CUSTOM_FIELD_TYPE.TEXT:
					case CUSTOM_FIELD_TYPE.HIDDEN:
						fields[field.id] = Property.ShortText({
							displayName: field.fieldLabel,
							required: false,
						});
						break;
					case CUSTOM_FIELD_TYPE.TEXTAREA:
						fields[field.id] = Property.LongText({
							displayName: field.fieldLabel,
							required: false,
						});
						break;
					case CUSTOM_FIELD_TYPE.DATE:
						fields[field.id] = Property.DateTime({
							displayName: field.fieldLabel,
							description: 'Please use YYYY-MM-DD format.',
							required: false,
						});
						break;
					case CUSTOM_FIELD_TYPE.DATETIME:
						fields[field.id] = Property.DateTime({
							displayName: field.fieldLabel,
							required: false,
						});
						break;
					case CUSTOM_FIELD_TYPE.MONEY:
					case CUSTOM_FIELD_TYPE.NUMBER:
						fields[field.id] = Property.Number({
							displayName: field.fieldLabel,
							required: false,
						});
						break;
					case CUSTOM_FIELD_TYPE.DROPDOWN:
					case CUSTOM_FIELD_TYPE.RADIO:
						fields[field.id] = Property.StaticDropdown({
							displayName: field.fieldLabel,
							required: false,
							options: {
								disabled: false,
								options: field.fieldOptions
									? field.fieldOptions?.map((option) => {
											return {
												label: option,
												value: option,
											};
									  })
									: [],
							},
						});
						break;
					case CUSTOM_FIELD_TYPE.CHECKBOX:
					case CUSTOM_FIELD_TYPE.LIST_BOX:
					case CUSTOM_FIELD_TYPE.MULTISELECT:
						fields[field.id] = Property.StaticMultiSelectDropdown({
							displayName: field.fieldLabel,
							required: false,
							options: {
								disabled: false,
								options: field.fieldOptions
									? field.fieldOptions?.map((option) => {
											return {
												label: option,
												value: option,
											};
									  })
									: [],
							},
						});
						break;
				}
			}
			return fields;
		},
	}),
	contactCustomFields: Property.DynamicProperties({
		displayName: 'Contact Custom Fields',
		refreshers: [],
		required: true,
		props: async ({ auth }) => {
			if (!auth) return {};

			const client = makeClient(auth as PiecePropValueSchema<typeof activeCampaignAuth>);
			const res = await client.listContactCustomFields();

			const fields: DynamicPropsValue = {};

			for (const field of res.fields) {
				switch (field.type) {
					case CUSTOM_FIELD_TYPE.TEXT:
					case CUSTOM_FIELD_TYPE.HIDDEN:
						fields[field.id] = Property.ShortText({
							displayName: field.title,
							required: false,
						});
						break;
					case CUSTOM_FIELD_TYPE.TEXTAREA:
						fields[field.id] = Property.LongText({
							displayName: field.title,
							required: false,
						});
						break;
					case CUSTOM_FIELD_TYPE.DATE:
						fields[field.id] = Property.DateTime({
							displayName: field.title,
							description: 'Please use YYYY-MM-DD format.',
							required: false,
						});
						break;
					case CUSTOM_FIELD_TYPE.DATETIME:
						fields[field.id] = Property.DateTime({
							displayName: field.title,
							required: false,
						});
						break;
					case CUSTOM_FIELD_TYPE.MONEY:
					case CUSTOM_FIELD_TYPE.NUMBER:
						fields[field.id] = Property.Number({
							displayName: field.title,
							required: false,
						});
						break;
					case CUSTOM_FIELD_TYPE.DROPDOWN:
					case CUSTOM_FIELD_TYPE.RADIO:
						fields[field.id] = Property.StaticDropdown({
							displayName: field.title,
							required: false,
							options: {
								disabled: false,
								options: res.fieldOptions
									.filter((option) => option.field === field.id)
									.map((option) => {
										return {
											label: option.label,
											value: option.value,
										};
									}),
							},
						});
						break;
					case CUSTOM_FIELD_TYPE.CHECKBOX:
					case CUSTOM_FIELD_TYPE.LIST_BOX:
					case CUSTOM_FIELD_TYPE.MULTISELECT:
						fields[field.id] = Property.StaticMultiSelectDropdown({
							displayName: field.title,
							required: false,
							options: {
								disabled: false,
								options: res.fieldOptions
									.filter((option) => option.field === field.id)
									.map((option) => {
										return {
											label: option.label,
											value: option.value,
										};
									}),
							},
						});
						break;
				}
			}
			return fields;
		},
	}),
};
