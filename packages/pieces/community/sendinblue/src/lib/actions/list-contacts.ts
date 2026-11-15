import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { listContactsActionOutputSchema } from '../output-schemas';

export const listContacts = createAction({
	auth: sendinblueAuth,
	name: 'list_contacts',
	outputSchema: listContactsActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Contacts',
	description: 'List contacts in a Brevo account, optionally filtered by list, segment, or modification date.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists Brevo contacts, optionally filtered by list membership, segment, creation date, or last modification date, with pagination and sort control. Use this to discover contacts matching criteria before acting on them with other contact actions. List and segment filters are mutually exclusive per Brevo. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		list_ids: Property.Array({
			displayName: 'List IDs',
			description: 'Only return contacts belonging to these list IDs. Mutually exclusive with Segment ID.',
			required: false,
		}),
		segment_id: Property.ShortText({
			displayName: 'Segment ID',
			description: 'Only return contacts belonging to this segment. Mutually exclusive with List IDs.',
			required: false,
		}),
		created_since: Property.DateTime({
			displayName: 'Created Since',
			description: 'Only return contacts created on or after this date.',
			required: false,
		}),
		modified_since: Property.DateTime({
			displayName: 'Modified Since',
			description: 'Only return contacts modified on or after this date.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Number of contacts to return. Maximum 1000.',
			required: false,
			defaultValue: 50,
		}),
		offset: Property.Number({
			displayName: 'Offset',
			description: 'Number of contacts to skip, for pagination.',
			required: false,
			defaultValue: 0,
		}),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			description: 'Sort contacts on their creation date.',
			required: false,
			options: {
				options: [
					{ label: 'Ascending', value: 'asc' },
					{ label: 'Descending', value: 'desc' },
				],
			},
		}),
	},
	async run(context) {
		const { list_ids, segment_id, created_since, modified_since, limit, offset, sort } =
			context.propsValue;

		const listIds = (list_ids ?? [])
			.map((listId) => Number(listId))
			.filter((listId) => Number.isFinite(listId));

		return await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/contacts',
			query: {
				listIds: listIds.length > 0 ? listIds.join(',') : undefined,
				segmentId: segment_id ? Number(segment_id) : undefined,
				createdSince: created_since,
				modifiedSince: modified_since,
				limit,
				offset,
				sort,
			},
		});
	},
});
