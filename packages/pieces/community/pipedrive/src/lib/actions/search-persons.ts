import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { V2SearchResponse, pipedriveAtomic } from '../common/atomic-helpers';
import { searchPersonsActionOutputSchema } from '../output-schemas';

export const searchPersonsAction = createAction({
	auth: pipedriveAuth,
	name: 'search-persons',
	outputSchema: searchPersonsActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'Search Persons',
	description: 'Searches persons by name, email, phone, notes or custom field text.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fuzzy text search over person names, emails, phones, notes and custom fields, ranked by relevance and optionally limited to one organization; returns one page with next_cursor. Use this to find a contact like "Jane at Acme"; Find Person instead does an exact match on one chosen field. The term needs at least 2 characters (1 with Exact Match). Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		term: Property.ShortText({
			displayName: 'Search Term',
			description: 'Text to search for. At least 2 characters, or 1 when Exact Match is Yes.',
			required: true,
		}),
		fields: Property.StaticMultiSelectDropdown<string>({
			displayName: 'Search In',
			description: 'Fields to search. Leave empty to search all of them.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Name', value: 'name' },
					{ label: 'Email', value: 'email' },
					{ label: 'Phone', value: 'phone' },
					{ label: 'Notes', value: 'notes' },
					{ label: 'Custom Fields', value: 'custom_fields' },
				],
			},
		}),
		exactMatch: pipedriveAtomic.exactMatchProp(),
		organizationId: Property.Number({
			displayName: 'Organization ID',
			description: 'Only persons linked to this organization ID (from Search Organizations).',
			required: false,
		}),
		...pipedriveAtomic.paginationProps(),
	},
	async run(context) {
		const props = context.propsValue;
		const term = pipedriveAtomic.assertSearchTerm({ term: props.term, exactMatch: props.exactMatch });
		const response = await pipedriveAtomic.call<V2SearchResponse>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: '/v2/persons/search',
			resourceLabel: 'person search',
			query: {
				term,
				fields: props.fields && props.fields.length > 0 ? props.fields : undefined,
				exact_match: props.exactMatch,
				organization_id: props.organizationId,
				limit: pipedriveAtomic.clampLimit(props.limit),
				cursor: pipedriveAtomic.emptyToUndefined(props.cursor),
			},
		});
		return pipedriveAtomic.flattenSearchItems(response);
	},
});
