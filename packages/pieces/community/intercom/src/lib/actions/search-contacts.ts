import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import {
	buildSearchQuery,
	dateFilters,
	SearchQuery,
	searchRecords,
} from '../common/lookups';
import { searchContactsOutputSchema } from '../output-schemas';

export const searchContactsAction = createAction({
	auth: intercomAuth,
	name: 'search_contacts',
	classification: 'SEARCH',
	displayName: 'Search Contacts',
	description: 'Finds contacts (users and leads) by email, name, tag, segment, update time or a custom attribute.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Finds contacts (users and leads) by email, name, tag, segment, update time or a custom attribute, one page at a time. Use to get contact IDs before Get Contact, Update Contact or Send Message to Contact; pass next_starting_after to continue. Read-only.',
		idempotent: true,
	},
	props: {
		email: Property.ShortText({ displayName: 'Email Is', required: false }),
		nameContains: Property.ShortText({ displayName: 'Name Contains', required: false }),
		role: Property.StaticDropdown({
			displayName: 'Role',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'User', value: 'user' },
					{ label: 'Lead', value: 'lead' },
				],
			},
		}),
		tagId: Property.ShortText({ displayName: 'Tag ID', description: 'From List Tags.', required: false }),
		segmentId: Property.ShortText({ displayName: 'Segment ID', required: false }),
		updatedAfter: Property.DateTime({
			displayName: 'Updated After',
			description: 'Intercom compares dates by calendar day in your workspace time zone.',
			required: false,
		}),
		updatedBefore: Property.DateTime({ displayName: 'Updated Before', required: false }),
		customAttribute: Property.ShortText({
			displayName: 'Custom Attribute Name',
			description: 'Match contacts whose custom attribute equals Custom Attribute Value.',
			required: false,
		}),
		customValue: Property.ShortText({ displayName: 'Custom Attribute Value', required: false }),
		advancedQuery: Property.Json({
			displayName: 'Advanced Query',
			description: 'Optional Intercom search filter, combined with the fields above using AND.',
			required: false,
		}),
		perPage: Property.Number({
			displayName: 'Results Per Page',
			description: '1 to 150. Default 50.',
			required: false,
		}),
		startingAfter: Property.ShortText({
			displayName: 'Starting After',
			description: 'The next_starting_after value from the previous page.',
			required: false,
		}),
	},
	outputSchema: searchContactsOutputSchema,
	async run(context) {
		const p = context.propsValue;
		const customAttribute = p.customAttribute?.trim();
		if (customAttribute && (p.customValue === undefined || p.customValue === '')) {
			throw new Error('Give a Custom Attribute Value together with the Custom Attribute Name.');
		}
		const filters: SearchQuery[] = [
			...(p.email?.trim() ? [{ field: 'email', operator: '=', value: p.email.trim() }] : []),
			...(p.nameContains?.trim() ? [{ field: 'name', operator: '~', value: p.nameContains.trim() }] : []),
			...(p.role ? [{ field: 'role', operator: '=', value: p.role }] : []),
			...(p.tagId?.trim() ? [{ field: 'tag_id', operator: '=', value: p.tagId.trim() }] : []),
			...(p.segmentId?.trim() ? [{ field: 'segment_id', operator: '=', value: p.segmentId.trim() }] : []),
			...dateFilters({ field: 'updated_at', after: p.updatedAfter, before: p.updatedBefore }),
			...(customAttribute ? [{ field: `custom_attributes.${customAttribute}`, operator: '=', value: p.customValue }] : []),
		];
		const query = buildSearchQuery({
			filters,
			advancedQuery: p.advancedQuery,
			fallback: { field: 'role', operator: 'IN', value: ['user', 'lead'] },
		});
		return searchRecords({ auth: context.auth, resource: 'contacts', query, perPage: p.perPage, startingAfter: p.startingAfter });
	},
});
