import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../auth';
import { attioPaginatedApiCall, buildMembersMap, normalizeRecord } from '../common/client';
import { AttioRecordResponse } from '../common/types';
import { formatInputFields, listFields, listIdDropdown } from '../common/props';

export const findListEntryAction = createAction({
	name: 'find_list_entry',
	displayName: 'Find List Entry',
	description:
		'Search for entries in a specific list in Attio using filters and return matching results.',
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

		// https://docs.attio.com/rest-api/endpoint-reference/entries/list-entries
		const records = await attioPaginatedApiCall<AttioRecordResponse>({
			method: HttpMethod.POST,
			accessToken,
			resourceUri: `/lists/${listId}/entries/query`,
			body: {
				filter: formattedFields,
			},
		});

		const membersMap = await buildMembersMap(accessToken, records);
		return {
			found: records.length > 0,
			result: records.map((r) => normalizeRecord(r, membersMap)),
		};
	},
});
