import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { V2SearchResponse, pipedriveAtomic } from '../common/atomic-helpers';
import { searchOrganizationsActionOutputSchema } from '../output-schemas';

export const searchOrganizationsAction = createAction({
	auth: pipedriveAuth,
	name: 'search-organizations',
	outputSchema: searchOrganizationsActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'Search Organizations',
	description: 'Searches organizations by name, address, notes or custom field text.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fuzzy text search over organization names, addresses, notes and custom fields, ranked by relevance; returns one page with next_cursor. Use this to find a company by name; Find Organization instead does an exact match on one chosen field. The term needs at least 2 characters (1 with Exact Match). Read-only and safe to retry.',
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
					{ label: 'Address', value: 'address' },
					{ label: 'Notes', value: 'notes' },
					{ label: 'Custom Fields', value: 'custom_fields' },
				],
			},
		}),
		exactMatch: pipedriveAtomic.exactMatchProp(),
		...pipedriveAtomic.paginationProps(),
	},
	async run(context) {
		const props = context.propsValue;
		const term = pipedriveAtomic.assertSearchTerm({ term: props.term, exactMatch: props.exactMatch });
		const response = await pipedriveAtomic.call<V2SearchResponse>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: '/v2/organizations/search',
			resourceLabel: 'organization search',
			query: {
				term,
				fields: props.fields && props.fields.length > 0 ? props.fields : undefined,
				exact_match: props.exactMatch,
				limit: pipedriveAtomic.clampLimit(props.limit),
				cursor: pipedriveAtomic.emptyToUndefined(props.cursor),
			},
		});
		return pipedriveAtomic.flattenSearchItems(response);
	},
});
