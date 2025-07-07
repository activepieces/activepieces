import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../';
import { CloseCRMSearchQuery } from '../common/types';
import { closeApiCall } from '../common/client';

export const findContact = createAction({
	auth: closeAuth,
	name: 'find_contact',
	displayName: 'Find Contact',
	description: 'Search for contacts by name, email, or other criteria with advanced filtering',
	props: {
		search_type: Property.StaticDropdown({
			displayName: 'Search Type',
			required: true,
			options: {
				options: [
					{ label: 'By Name', value: 'name' },
					{ label: 'By Email', value: 'email' },
					{ label: 'By Phone', value: 'phone' },
					{ label: 'By Lead ID', value: 'lead_id' },
				],
			},
		}),
		search_query: Property.ShortText({
			displayName: 'Search Query',
			required: true,
		}),
		match_type: Property.StaticDropdown({
			displayName: 'Match Type',
			required: false,
			options: {
				options: [
					{ label: 'Contains', value: 'contains' },
					{ label: 'Exact Match', value: 'exact' },
					{ label: 'Starts With', value: 'starts' },
					{ label: 'Ends With', value: 'ends' },
				],
			},
			defaultValue: 'contains',
		}),
	},
	async run(context) {
		const { search_type, search_query, match_type } = context.propsValue;

		try {
			// Build the search query
			const searchQuery = buildSearchQuery({
				search_type,
				search_query,
				match_type: match_type || 'contains',
				include_fields: ['title', 'id', 'name', 'emails'],
			});

			let cursor: string | undefined;

			const result = [];

			do {
				const response = await closeApiCall<{
					cursor?: string;
					data: Record<string, any>[];
				}>({
					accessToken: context.auth,
					method: HttpMethod.POST,
					resourceUri: '/data/search/',
					body: {
						_limit: 100,
						cursor,
						...searchQuery,
					},
				});

				const { data } = response;
				if (!data || data.length === 0) break;

				result.push(...data);
				cursor = response.cursor;
			} while (cursor);

			return {
				found: result.length > 0,
				result,
			};
		} catch (error: any) {
			if (error.response?.status === 400) {
				throw new Error(`Invalid search query: ${error.response.body?.error || 'Unknown error'}`);
			}
			if (error.response?.status === 401) {
				throw new Error('Authentication failed. Please check your API key.');
			}
			throw new Error(`Failed to search contacts: ${error.message}`);
		}
	},
});

// Helper function to build the search query
function buildSearchQuery(params: {
	search_type: string;
	search_query: string;
	match_type: string;
	include_fields: string[];
}): CloseCRMSearchQuery {
	const { search_type, search_query, match_type, include_fields } = params;

	const baseQuery = {
		type: 'object_type',
		object_type: 'contact',
	};

	let fieldCondition;

	switch (search_type) {
		case 'name':
			fieldCondition = {
				type: 'field_condition',
				field: {
					type: 'regular_field',
					object_type: 'contact',
					field_name: 'name',
				},
				condition: {
					type: 'text',
					mode: 'full_words',
					value: search_query,
				},
			};
			break;

		case 'email':
			fieldCondition = {
				type: 'has_related',
				this_object_type: 'contact',
				related_object_type: 'contact_email',
				related_query: {
					type: 'field_condition',
					field: {
						type: 'regular_field',
						object_type: 'contact_email',
						field_name: 'email',
					},
					condition: {
						type: 'text',
						mode: 'phrase',
						value: search_query,
					},
				},
			};
			break;

		case 'phone':
			fieldCondition = {
				type: 'has_related',
				this_object_type: 'contact',
				related_object_type: 'contact_phone',
				related_query: {
					type: 'field_condition',
					field: {
						type: 'regular_field',
						object_type: 'contact_phone',
						field_name: 'phone',
					},
					condition: {
						type: 'text',
						mode: 'phrase',
						value: search_query,
					},
				},
			};
			break;

		case 'lead_id':
			fieldCondition = {
				type: 'field_condition',
				field: {
					type: 'regular_field',
					object_type: 'contact',
					field_name: 'lead_id',
				},
				condition: {
					type: 'text',
					mode: 'phrase', // Always exact match for IDs
					value: search_query,
				},
			};
			break;

		default:
			throw new Error(`Unsupported search type: ${search_type}`);
	}

	return {
		query: {
			type: 'and',
			queries: [baseQuery, fieldCondition],
		},
		_fields: {
			lead: ['id', 'name', 'status_label', 'contacts'],
			contact: ['id', 'name', 'emails', 'phones'],
		},
	};
}
