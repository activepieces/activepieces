import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../auth';
import { CloseCRMSearchQuery } from '../common/types';
import { CloseApiError, closeApiCall } from '../common/client';

export const findContact = createAction({
	auth: closeAuth,
	name: 'find_contact',
	classification: 'SEARCH',
	displayName: 'Find Contact',
	description: 'Search for contacts by name, email, or other criteria with advanced filtering',
	audience: 'human',
	aiMetadata: {
		description: 'Searches contacts in Close CRM and returns all matching records (auto-paginated). The search type selects which field to match on — contact name, email, phone, or parent lead ID — and the match mode controls comparison. Use to resolve a contact by a known attribute (e.g. find a contact ID before attaching an opportunity). Read-only and idempotent. Requires a search query value.',
		idempotent: true,
	},
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
					{ label: 'All Words (any order)', value: 'contains' },
					{ label: 'Exact Phrase', value: 'exact' },
					
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
					data: Record<string, unknown>[];
				}>({
					accessToken: context.auth.secret_text,
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
		} catch (error) {
			if (error instanceof CloseApiError && error.status === 400) {
				throw new Error(`Invalid search query. ${error.message}`);
			}
			throw error;
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
	const textMode = match_type === 'exact' ? 'phrase' : 'full_words';

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
					mode: textMode,
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
						mode: textMode,
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
						mode: textMode,
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
					type: 'reference',
					reference_type: 'lead',
					object_ids: [search_query.trim()],
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
			contact: Array.from(new Set([...include_fields, 'lead_id', 'phones'])),
		},
	};
}
