import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { attioApiCall, attioPaginatedApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
	AttributeResponse,
	CallRecordingResponse,
	ListResponse,
	MeetingResponse,
	ObjectResponse,
	SelectOptionResponse,
} from './types';
import { isNil } from '@activepieces/shared';
import { attioAuth } from '../auth';

interface DropdownParams {
	displayName: string;
	description?: string;
	required: boolean;
}

export const objectTypeIdDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		auth: attioAuth,
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
				accessToken: auth.secret_text,
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
		auth: attioAuth,
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
				accessToken: auth.secret_text,
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

export const taskIdDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		auth: attioAuth,
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

			const response = await attioApiCall<{ data: Array<Record<string, any>> }>({
				accessToken: auth.secret_text,
				method: HttpMethod.GET,
				resourceUri: '/tasks',
				query: { limit: 200 },
			});

			return {
				disabled: false,
				options: response.data.map((task) => ({
					label: task['content_plaintext'] ?? task['id']?.task_id,
					value: task['id']?.task_id,
				})),
			};
		},
	});

export const linkedRecordDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		auth: attioAuth,
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: ['linked_object'],
		options: async ({ auth, linked_object }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account first.',
				};
			}

			if (!linked_object) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please select a Linked Object first.',
				};
			}

			const response = await attioApiCall<{ data: Array<Record<string, any>> }>({
				accessToken: auth.secret_text,
				method: HttpMethod.POST,
				resourceUri: `/objects/${linked_object}/records/query`,
				body: { limit: 200, offset: 0 },
			});

			return {
				disabled: false,
				options: response.data.map((record) => {
					const nameValues: Array<any> = record['values']?.['name'] ?? [];
					const label =
						nameValues[0]?.full_name ??
						nameValues[0]?.value ??
						record['id']?.record_id;
					return { label: String(label), value: record['id']?.record_id };
				}),
			};
		},
	});

export const meetingIdDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		auth: attioAuth,
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

			try {
				const response = await attioApiCall<{ data: Array<MeetingResponse> }>({
					accessToken: auth.secret_text,
					method: HttpMethod.GET,
					resourceUri: '/meetings',
					query: { limit: 200, sort: 'start_desc' },
				});

				return {
					disabled: false,
					options: response.data.map((meeting) => ({
						label: meeting.title || meeting.id.meeting_id,
						value: meeting.id.meeting_id,
					})),
				};
			} catch {
				return {
					disabled: true,
					options: [],
					placeholder:
						'Failed to load meetings. Ensure your API key has the "meeting:read" scope.',
				};
			}
		},
	});

export const callRecordingIdDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		auth: attioAuth,
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: ['meeting_id'],
		options: async ({ auth, meeting_id }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account first.',
				};
			}

			if (!meeting_id) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please select a meeting first.',
				};
			}

			try {
				const response = await attioApiCall<{ data: Array<CallRecordingResponse> }>({
					accessToken: auth.secret_text,
					method: HttpMethod.GET,
					resourceUri: `/meetings/${meeting_id}/call_recordings`,
					query: { limit: 200 },
				});

				return {
					disabled: false,
					options: response.data.map((rec) => ({
						label: `${rec.created_at} (${rec.status})`,
						value: rec.id.call_recording_id,
					})),
				};
			} catch {
				return {
					disabled: true,
					options: [],
					placeholder:
						'Failed to load recordings. Ensure your API key has the "call_recording:read" scope.',
				};
			}
		},
	});

export const listParentObjectIdDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		auth: attioAuth,
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
				accessToken: auth.secret_text,
				method: HttpMethod.GET,
				resourceUri: `/lists/${listId}`,
			});

			return {
				disabled: false,
				options: [{ label: response.data.parent_object[0], value: response.data.parent_object[0] }],
			};
		},
	});

function toSingular(title: string): string {
	if (title.endsWith('es')) return title.slice(0, -2);
	if (title.endsWith('s')) return title.slice(0, -1);
	return title;
}

async function createPropertyDefinition(
	property: AttributeResponse,
	objectType:'lists'|'objects',
	objectTypeId: string,
	accessToken: string,
	isSearch=false,
	allOptional=false,
) {
	const { api_slug, title, is_required, type, is_multiselect } = property;
	const required = isSearch || allOptional ? false : is_required

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
		case 'record-reference': {
			const targetSlug = property.relationship?.object_slug;
			const label = targetSlug ?? 'record';
			const field = is_multiselect ? Property.Array : Property.ShortText;
			return field({
				displayName: title,
				required,
				description: is_multiselect
					? `Enter ${label} IDs (one per item).`
					: `Enter the ${label} ID.`,
			});
		}
		case 'actor-reference': {
			const basicField = is_multiselect ? Property.Array : Property.ShortText;
			return basicField({
				displayName: title,
				required,
			});
		}
		case 'email-address':
		case 'domain': {
			// Filter API only accepts a single plain string; force ShortText in search mode
			const basicField = isSearch || !is_multiselect ? Property.ShortText : Property.Array;
			const singularTitle = isSearch ? toSingular(title) : title;
			return basicField({
				displayName: singularTitle,
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

export const objectFields =(isSearch=false, allOptional=false)=> Property.DynamicProperties({
	auth: attioAuth,
	displayName: 'Object Attributes',
	refreshers: ['objectTypeId'],
	required: false,
	props: async ({ auth, objectTypeId }) => {
		if (!auth || !objectTypeId) return {};

		const accessToken = auth.secret_text;
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

			props[api_slug] =await createPropertyDefinition(attribute,'objects', objectId, accessToken, isSearch, allOptional);
		}

		return Object.fromEntries(Object.entries(props).filter(([_, prop]) => prop !== null));
	},
});

export const listFields =(isSearch=false, allOptional=false)=> Property.DynamicProperties({
	auth: attioAuth,
	displayName: 'List Attributes',
	refreshers: ['listId'],
	required: false,
	props: async ({ auth, listId }) => {
		if (!auth || !listId) return {};

		const accessToken = auth.secret_text;
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

			props[api_slug] =await createPropertyDefinition(attribute,'lists', list_id, accessToken, isSearch, allOptional);
		}

		return Object.fromEntries(Object.entries(props).filter(([_, prop]) => prop !== null));
	},
});

export async function formatInputFields(
	accessToken: string,
	objectType:'lists'|'objects',
	objectId: string,
	inputValues: Record<string, any>,
	isSearch = false,
) {
	const attributes = await attioPaginatedApiCall<AttributeResponse>({
		method: HttpMethod.GET,
		accessToken: accessToken,
		resourceUri: `/${objectType}/${objectId}/attributes`,
	});

	const typeMapping = attributes.reduce((acc, attr) => {
		acc[attr.api_slug] = {
			type: attr.type,
			is_multiselect: attr.is_multiselect,
			object_slug: attr.relationship?.object_slug ?? null,
		};
		return acc;
	}, {} as Record<string, { type: string; is_multiselect: boolean; object_slug: string | null }>);

	const formattedFields: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(inputValues)) {
		if (isNil(value) || value === '') continue;
		if(Array.isArray(value) && value.length === 0) continue;

		const fieldType = typeMapping[key]?.type;

		switch (fieldType) {
			case 'record-reference': {
				if (isSearch) {
					// Filter API shorthand: plain ID string for $eq, $in array for multiple
					const ids: string[] = Array.isArray(value) ? value : [value];
					formattedFields[key] = ids.length === 1 ? ids[0] : { $in: ids };
				} else {
					const targetSlug = typeMapping[key]?.object_slug;
					const ids: string[] = Array.isArray(value) ? value : [value];
					formattedFields[key] = ids.map((id) =>
						targetSlug
							? { target_record_id: id, target_object: targetSlug }
							: { target_record_id: id },
					);
				}
				break;
			}
			case 'phone-number':
				formattedFields[key] = isSearch ? value : [value];
				break;
			case 'email-address':
			case 'domain':
				if (isSearch) {
					// Attio filter API expects a plain string for email/domain attributes, not an array
					formattedFields[key] = Array.isArray(value) ? value[0] : value;
				} else {
					formattedFields[key] = typeof value === 'string' ? [value] : value;
				}
				break;
			case 'select':
				if (isSearch) {
					// Attio filter API expects a plain string for select attributes, not an array
					formattedFields[key] = Array.isArray(value) ? value[0] : value;
				} else {
					formattedFields[key] = typeof value === 'string' ? [value] : value;
				}
				break;
			default:
				formattedFields[key] = value;
				break;
		}
	}

	return formattedFields;
}
