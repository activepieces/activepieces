import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { attioApiCall, attioPaginatedApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';
import { AttributeResponse, ListResponse, ObjectResponse, SelectOptionResponse } from './types';
import { isNil } from '@activepieces/shared';

interface DropdownParams {
	displayName: string;
	description?: string;
	required: boolean;
}

export const objectTypeIdDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account first.',
				};
			}

			const response = await attioApiCall<{ data: Array<ObjectResponse> }>({
				accessToken: auth as string,
				method: HttpMethod.GET,
				resourceUri: '/objects',
			});

			return {
				disabled: false,
				options: response.data.map((obj) => ({
					label: obj.singular_noun,
					value: obj.id.object_id,
				})),
			};
		},
	});

export const listIdDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account first.',
				};
			}

			const response = await attioApiCall<{ data: Array<ListResponse> }>({
				accessToken: auth as string,
				method: HttpMethod.GET,
				resourceUri: '/lists',
			});

			return {
				disabled: false,
				options: response.data.map((obj) => ({
					label: obj.name,
					value: obj.id.list_id,
				})),
			};
		},
	});

export const listParentObjectIdDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: ['listId'],
		options: async ({ auth, listId }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account first.',
				};
			}

			if (!listId) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please select list first.',
				};
			}

			const response = await attioApiCall<{ data: ListResponse }>({
				accessToken: auth as string,
				method: HttpMethod.GET,
				resourceUri: `/lists/${listId}`,
			});

			return {
				disabled: false,
				options: [{ label: response.data.parent_object[0], value: response.data.parent_object[0] }],
			};
		},
	});

async function createPropertyDefinition(
	property: AttributeResponse,
	objectType:'lists'|'objects',
	objectTypeId: string,
	accessToken: string,
	isSearch=false
) {
	const { api_slug, title, is_required, type, is_multiselect } = property;
	const required = isSearch ? false : is_required

	switch (type) {
		case 'text':
		case 'currency':
		case 'location':
		case 'phone-number':
		case 'personal-name':
			return Property.ShortText({
				displayName: title,
				required,
				description:
					type === 'personal-name'
						? 'Provide comma-separated format name i.e. Last name(s), First name(s).'
						: '',
			});
		case 'number':
		case 'rating':
			return Property.Number({
				displayName: title,
				required,
			});
		case 'checkbox':
			return Property.Checkbox({
				displayName: title,
				required,
			});
		case 'date':
		case 'timestamp':
			return Property.DateTime({
				displayName: title,
				required,
			});
		case 'actor-reference':
		case 'email-address':
		case 'domain': {
			const basicField = is_multiselect ? Property.Array : Property.ShortText;
			return basicField({
				displayName: title,
				required,
			});
		}
		case 'status': {
			const response = await attioApiCall<{ data: SelectOptionResponse[] }>({
				method: HttpMethod.GET,
				accessToken: accessToken,
				resourceUri: `/${objectType}/${objectTypeId}/attributes/${api_slug}/statuses`,
			});

			return Property.StaticDropdown({
				displayName: title,
				required,
				options: {
					disabled: false,
					options: response.data.map((opt) => ({
						label: opt.title,
						value: opt.title,
					})),
				},
			});
		}
		case 'select': {
			const response = await attioApiCall<{ data: SelectOptionResponse[] }>({
				method: HttpMethod.GET,
				accessToken: accessToken,
				resourceUri: `/${objectType}/${objectTypeId}/attributes/${api_slug}/options`,
			});

			const dropdownType = is_multiselect
				? Property.StaticMultiSelectDropdown
				: Property.StaticDropdown;

			return dropdownType({
				displayName: title,
				required,
				options: {
					disabled: false,
					options: response.data.map((opt) => ({
						label: opt.title,
						value: opt.title,
					})),
				},
			});
		}
		default:
			return null;
	}
}

export const objectFields =(isSearch=false)=> Property.DynamicProperties({
	displayName: 'Object Attributes',
	refreshers: ['objectTypeId'],
	required: false,
	props: async ({ auth, objectTypeId }) => {
		if (!auth || !objectTypeId) return {};

		const accessToken = auth as unknown as string;
		const objectId = objectTypeId as unknown as string;
		const props: DynamicPropsValue = {};

		const response = await attioPaginatedApiCall<AttributeResponse>({
			method: HttpMethod.GET,
			accessToken: accessToken,
			resourceUri: `/objects/${objectId}/attributes`,
		});

		for (const attribute of response) {
			if (!attribute.is_writable) continue;

			const { api_slug } = attribute;

			props[api_slug] =await createPropertyDefinition(attribute,'objects', objectId, accessToken,isSearch);
		}

		return Object.fromEntries(Object.entries(props).filter(([_, prop]) => prop !== null));
	},
});

export const listFields =(isSearch=false)=> Property.DynamicProperties({
	displayName: 'List Attributes',
	refreshers: ['listId'],
	required: false,
	props: async ({ auth, listId }) => {
		if (!auth || !listId) return {};

		const accessToken = auth as unknown as string;
		const list_id = listId as unknown as string;
		const props: DynamicPropsValue = {};

		const response = await attioPaginatedApiCall<AttributeResponse>({
			method: HttpMethod.GET,
			accessToken: accessToken,
			resourceUri: `/lists/${list_id}/attributes`,
		});

		for (const attribute of response) {
			if (!attribute.is_writable) continue;

			const { api_slug } = attribute;

			props[api_slug] =await createPropertyDefinition(attribute,'lists', list_id, accessToken,isSearch);
		}

		return Object.fromEntries(Object.entries(props).filter(([_, prop]) => prop !== null));
	},
});

export async function formatInputFields(
	accessToken: string,
	objectType:'lists'|'objects',
	objectId: string,
	inputValues: Record<string, any>,
) {
	const attributes = await attioPaginatedApiCall<AttributeResponse>({
		method: HttpMethod.GET,
		accessToken: accessToken,
		resourceUri: `/${objectType}/${objectId}/attributes`,
	});

	const typeMapping = attributes.reduce((acc, { api_slug, type }) => {
		acc[api_slug] = type;
		return acc;
	}, {} as Record<string, string>);

	const formattedFields: Record<string, any> = {};

	for (const [key, value] of Object.entries(inputValues)) {
		if (isNil(value) || value === '') continue;
		if(Array.isArray(value) && value.length === 0) continue;

		const fieldType = typeMapping[key];

		switch (fieldType) {
			case 'phone-number':
				formattedFields[key] = [value];
				break;
			case 'domain':
			case 'select':
				formattedFields[key] = typeof value === 'string' ? [value] : value;
				break;
			default:
				formattedFields[key] = value;
				break;
		}
	}

	return formattedFields;
}
