import { createAction } from '@activepieces/pieces-framework';
import { NinoxAuth } from '../common/auth';
import { BASE_URL, makeRequest } from '../common/client';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
	teamidDropdown,
	databaseIdDropdown,
	tableIdDropdown,
	recordIdDropdown,
	filenameDropdown,
} from '../common/props';

export const downloadFileFromRecord = createAction({
	auth: NinoxAuth,
	name: 'downloadFileFromRecord',
	displayName: 'Download File from Record',
	description: 'Downloads a file attached to a record.',
	props: {
		teamid: teamidDropdown,
		dbid: databaseIdDropdown,
		tid: tableIdDropdown,
		rid: recordIdDropdown,
		file: filenameDropdown,
	},
	async run({ auth, propsValue, files }) {
		const { teamid, dbid, tid, rid, file } = propsValue;

		const path = `/teams/${teamid}/databases/${dbid}/tables/${tid}/records/${rid}/files/${file}`;

		try {
			const fileMetadata = await makeRequest<{ name: string }>(
				auth,
				HttpMethod.GET,
				`${path}/metadata`,
			);

			const response = await httpClient.sendRequest({
				method: HttpMethod.GET,
				url: BASE_URL + path,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth,
				},
				responseType: 'arraybuffer',
			});

			return {
				...fileMetadata,
				file: await files.write({
					data: Buffer.from(response.body),
					fileName: fileMetadata.name,
				}),
			};
		} catch (error) {
			throw new Error(`Failed to download file: ${error}`);
		}
	},
});
