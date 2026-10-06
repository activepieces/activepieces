import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../auth';
import { attioPaginatedApiCall, buildMembersMap, normalizeRecord } from '../common/client';
import { AttioListEntryResponse } from '../common/types';
import { formatInputFields, listFields, listIdDropdown } from '../common/props';
import { findListEntryOutputSchema } from '../output-schemas';

export const findListEntryAction = createAction({
	name: 'find_list_entry',
	outputSchema: findListEntryOutputSchema,
	classification: 'SEARCH',
	displayName: 'Find List Entry',
	description:
		'Search for entries in a specific list in Attio using filters and return matching results.',
	audience: 'human',
	aiMetadata: { description: 'Queries the entries of a specific Attio list, returning entries that match the supplied attribute filters; at least one filter is required. Use this to find list entries before updating or referencing them. Read-only and idempotent.', idempotent: true },
	auth: attioAuth,
	props: {
		listId: listIdDropdown({
			displayName: 'List',
			required: true,
		}),
		attributes: listFields(true),
	},
	async run(context) {
		const accessToken = context.auth.secret_text;
		const { listId } = context.propsValue;
		const inputFields = context.propsValue.attributes ?? {};

		if (!listId) {
			throw new Error('Provided list type is invalid.');
		}

		const formattedFields = await formatInputFields(accessToken, 'lists', listId, inputFields, true);

		if (Object.keys(formattedFields).length === 0) {
			throw new Error('Provide at least one attribute filter.');
		}

		// https://docs.attio.com/rest-api/endpoint-reference/entries/list-entries
		const entries = await attioPaginatedApiCall<AttioListEntryResponse>({
			method: HttpMethod.POST,
			accessToken,
			resourceUri: `/lists/${listId}/entries/query`,
			body: {
				filter: formattedFields,
			},
		});

		const records = entries.map(({ entry_values, ...entry }) => ({ ...entry, values: entry_values }));
		const membersMap = await buildMembersMap(accessToken, records);
		return {
			found: records.length > 0,
			result: records.map((r) => normalizeRecord(r, membersMap)),
		};
	},
});
