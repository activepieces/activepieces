import { createAction, Property } from '@activepieces/pieces-framework';
import {
	httpClient,
	HttpMethod,
	AuthenticationType,
	HttpRequest,
} from '@activepieces/pieces-common';
import { getAccessToken, googleSheetsAuth } from '../common/common';

export const sheetsSearchSpreadsheets = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_search_spreadsheets',
	displayName: 'Find Spreadsheets',
	description: 'Find spreadsheet(s) by name.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Searches Google Drive for spreadsheets whose name matches a query (exact or contains), returning id, name, and links. Use to resolve a spreadsheet id from a human-readable name before acting on it — the resolver for every other atomic\'s spreadsheet_id. Read-only.',
		idempotent: true,
	},
	props: {
		spreadsheet_name: Property.ShortText({
			displayName: 'Spreadsheet Name',
			description: 'The name of the spreadsheet to search for.',
			required: true,
		}),
		exact_match: Property.Checkbox({
			displayName: 'Exact Match',
			description:
				'If true, only return spreadsheets that exactly match the name. If false, return spreadsheets that contain the name.',
			required: false,
			defaultValue: false,
		}),
	},
	async run({ propsValue, auth }) {
		const searchValue = propsValue.spreadsheet_name;
		const queries = ["mimeType='application/vnd.google-apps.spreadsheet'", 'trashed=false'];

		if (propsValue.exact_match) {
			queries.push(`name = '${searchValue}'`);
		} else {
			queries.push(`name contains '${searchValue}'`);
		}

		const files = [];
		let pageToken = null;

		do {
			const request: HttpRequest = {
				method: HttpMethod.GET,
				url: 'https://www.googleapis.com/drive/v3/files',
				queryParams: {
					q: queries.join(' and '),
					includeItemsFromAllDrives: 'false',
					supportsAllDrives: 'true',
					corpora: 'user',
					fields: 'files(id,name,webViewLink,createdTime,modifiedTime),nextPageToken',
				},
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: await getAccessToken(auth),
				},
			};
			if (pageToken) {
				if (request.queryParams !== undefined) {
					request.queryParams['pageToken'] = pageToken;
				}
			}
			try {
				const response = await httpClient.sendRequest<{
					files: { id: string; name: string }[];
					nextPageToken: string;
				}>(request);

				files.push(...response.body.files);
				pageToken = response.body.nextPageToken;
			} catch (e) {
				throw new Error(`Failed to search spreadsheets\nError:${e}`);
			}
		} while (pageToken);

		return {
			found: files.length > 0,
			spreadsheets: files,
		};
	},
});
