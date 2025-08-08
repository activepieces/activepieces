import { createAction, Property } from '@activepieces/pieces-framework';
import { NinoxAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
	teamidDropdown,
	databaseIdDropdown,
	tableIdDropdown,
	tablefieldDropdown,
} from '../common/props';

export const findRecord = createAction({
	auth: NinoxAuth,
	name: 'findRecord',
	displayName: 'Find Record',
	description: 'Finds records by field values.',
	props: {
		teamid: teamidDropdown,
		dbid: databaseIdDropdown,
		tid: tableIdDropdown,
		searchField: tablefieldDropdown,
		searchValue: Property.ShortText({
			displayName: 'Search Value',
			description: 'The value to search for in the specified field.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const { teamid, dbid, tid, searchField, searchValue } = propsValue;

		const path = `/teams/${teamid}/databases/${dbid}/tables/${tid}/record`;

		try {
			const response = await makeRequest(auth as string, HttpMethod.POST, path, {
				filters: { [searchField]: searchValue },
			});

			const found = Array.isArray(response) && response.length === 0 ? false : true;

			return {
				found,
				data: found ? response : {},
			};
		} catch (error) {
			throw new Error(`Failed to find records: ${error}`);
		}
	},
});
