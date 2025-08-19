import { createAction } from '@activepieces/pieces-framework';
import { NinoxAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
	teamidDropdown,
	databaseIdDropdown,
	tableIdDropdown,
	recordIdDropdown,
	tableFields,
} from '../common/props';

export const updateRecord = createAction({
	auth: NinoxAuth,
	name: 'updateRecord',
	displayName: 'Update Record',
	description: 'Updates fields on an existing record.',
	props: {
		teamid: teamidDropdown,
		dbid: databaseIdDropdown,
		tid: tableIdDropdown,
		rid: recordIdDropdown,
		fields: tableFields,
	},
	async run({ auth, propsValue }) {
		const { teamid, dbid, tid, rid, fields } = propsValue;

		const path = `/teams/${teamid}/databases/${dbid}/tables/${tid}/records/${rid}`;

		// Filter out empty values and prepare the record data
		const recordData: Record<string, any> = {};
		Object.keys(fields).forEach((key) => {
			if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') {
				recordData[key] = fields[key];
			}
		});

		try {
			const response = await makeRequest(auth as string, HttpMethod.PUT, path, {
				fields: recordData,
			});

			return response;
		} catch (error) {
			throw new Error(`Failed to update record: ${error}`);
		}
	},
});
