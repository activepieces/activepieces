import { createAction, Property } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { listContactsOutputSchema } from '../../output-schemas';

export const listContactsAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_list_contacts',
	outputSchema: listContactsOutputSchema,
	displayName: 'List Contacts',
	description: 'Lists contacts in a list, filtered by tag, status or dates.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists contacts in an EmailOctopus list, one page at a time, optionally filtered by tag, status and created or updated date ranges. Without a status filter EmailOctopus returns only subscribed contacts. Returns `paging.next.starting_after` to fetch the next page with the same filters.',
		idempotent: true,
	},
	props: {
		listId: emailOctopusAiProps.listId({ required: true }),
		tag: emailOctopusAiProps.tag({
			required: false,
			description: 'Only contacts with this tag.',
		}),
		status: emailOctopusAiProps.status({
			required: false,
			description: 'Only contacts with this status. Defaults to subscribed.',
		}),
		createdAfter: Property.ShortText({
			displayName: 'Created On or After',
			description: 'ISO 8601 date-time, e.g. 2026-01-31T00:00:00Z.',
			required: false,
		}),
		createdBefore: Property.ShortText({
			displayName: 'Created On or Before',
			description: 'ISO 8601 date-time.',
			required: false,
		}),
		updatedAfter: Property.ShortText({
			displayName: 'Updated On or After',
			description: 'ISO 8601 date-time.',
			required: false,
		}),
		updatedBefore: Property.ShortText({
			displayName: 'Updated On or Before',
			description: 'ISO 8601 date-time.',
			required: false,
		}),
		limit: emailOctopusAiProps.limit({ required: false }),
		startingAfter: emailOctopusAiProps.startingAfter({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		const filters = Object.fromEntries(
			Object.entries({
				tag: p.tag,
				status: p.status,
				'created_at.gte': p.createdAfter,
				'created_at.lte': p.createdBefore,
				'last_updated_at.gte': p.updatedAfter,
				'last_updated_at.lte': p.updatedBefore,
			}).filter(
				(entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== '',
			),
		);
		return await emailOctopusApi.listContacts({
			auth: context.auth,
			listId: p.listId,
			filters,
			limit: p.limit ?? undefined,
			startingAfter: p.startingAfter ?? undefined,
		});
	},
});
