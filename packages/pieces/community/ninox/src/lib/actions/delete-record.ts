import { createAction } from '@activepieces/pieces-framework';
import { NinoxAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
	teamidDropdown,
	databaseIdDropdown,
	tableIdDropdown,
	recordIdDropdown,
} from '../common/props';

export const deleteRecord = createAction({
	auth: NinoxAuth,
	name: 'deleteRecord',
	displayName: 'Delete Record',
	description: 'Deletes a record from a table.',
	audience: 'both',
	aiMetadata: {
		description: 'Permanently removes one record from a Ninox table, addressed by team, database, table, and record id. Use when the target record id is known and it should be deleted. Idempotent in effect — once removed, repeating the call leaves the record absent.',
		idempotent: true,
	},
	props: {
		teamid: teamidDropdown,
		dbid: databaseIdDropdown,
		tid: tableIdDropdown,
		recordId: recordIdDropdown,
	},
	async run({ auth, propsValue }) {
		const { teamid, dbid, tid, recordId } = propsValue;

		const path = `/teams/${teamid}/databases/${dbid}/tables/${tid}/records/${recordId}`;

		try {
			await makeRequest(auth.secret_text, HttpMethod.DELETE, path);

			return { success: true, message: 'Record deleted successfully' };
		} catch (error) {
			throw new Error(`Failed to delete record: ${error}`);
		}
	},
});
