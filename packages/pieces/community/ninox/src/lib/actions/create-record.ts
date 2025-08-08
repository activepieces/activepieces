import { createAction } from '@activepieces/pieces-framework';
import { NinoxAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
	teamidDropdown,
	databaseIdDropdown,
	tableIdDropdown,
	tableFields,
} from '../common/props';

export const createRecord = createAction({
	auth: NinoxAuth,
	name: 'createRecord',
	displayName: 'Create Record',
	description: 'Creates a new record into a specified table.',
	props: {
		teamid: teamidDropdown,
		dbid: databaseIdDropdown,
		tid: tableIdDropdown,
		fields: tableFields,
	},
	async run({ auth, propsValue }) {
		const { teamid, dbid, tid, fields } = propsValue;

		const path = `/teams/${teamid}/databases/${dbid}/tables/${tid}/records`;

		// Filter out empty values and prepare the record data
		const recordData: Record<string, any> = {};
		Object.keys(fields).forEach((key) => {
			if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') {
				recordData[key] = fields[key];
			}
		});

		const requestBody = {
			_upsert: true,
			fields: recordData,
		};

		try {
			const response = await makeRequest(auth as string, HttpMethod.POST, path, requestBody);

			return response;
		} catch (error) {
			throw new Error(`Failed to create record: ${error}`);
		}
	},
});
