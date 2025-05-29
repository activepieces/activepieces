import {
	DropdownOption,
	PiecePropValueSchema,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon, transformRecordFields } from '../common/props';
import { smartSuiteApiCall, TableStucture } from '../common';
import FormData from 'form-data';

export const uploadFile = createAction({
	name: 'upload_file',
	displayName: 'Upload File',
	description: 'Uploads a file and attaches it to a record.',
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		recordId: smartsuiteCommon.recordId,
		field: Property.Dropdown({
			displayName: 'Search Field',
			required: true,
			refreshers: ['tableId'],
			options: async ({ auth, tableId }) => {
				if (!auth || !tableId) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please connect your account first.',
					};
				}

				const { apiKey, accountId } = auth as PiecePropValueSchema<typeof smartsuiteAuth>;

				const response = await smartSuiteApiCall<{
					structure: TableStucture[];
				}>({
					apiKey,
					accountId,
					method: HttpMethod.GET,
					resourceUri: `/applications/${tableId}`,
				});

				const options: DropdownOption<string>[] = [];

				for (const field of response.structure) {
					if (field.field_type === 'filefield') {
						options.push({ label: field.label, value: field.slug });
					}
				}
				return {
					disabled: false,
					options,
				};
			},
		}),
		file: Property.File({
			displayName: 'File',
			description: 'The file to upload',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const { recordId, field, tableId, file } = propsValue;
		try {
			const formData = new FormData();

			formData.append('files', Buffer.from(file.base64, 'base64'), file.filename);

			const response = await httpClient.sendRequest({
				method: HttpMethod.POST,
				url: `https://app.smartsuite.com/api/v1/recordfiles/${tableId}/${recordId}/${field}/`,
				body: formData,
				headers: {
					...formData.getHeaders(),
					Authorization: `Token ${auth.apiKey}`,
					'ACCOUNT-ID': auth.accountId,
				},
			});

			const tableResponse = await smartSuiteApiCall<{
				structure: TableStucture[];
			}>({
				apiKey: auth.apiKey,
				accountId: auth.accountId,
				method: HttpMethod.GET,
				resourceUri: `/applications/${tableId}`,
			});
			const tableSchema = tableResponse.structure;

			const formattedFields = transformRecordFields(tableSchema, response.body);

			return formattedFields;
		} catch (error: any) {
			if (error.response?.status === 400) {
				throw new Error(
					`Invalid file format or size: ${
						error.response?.body?.message || 'File may be too large or in an unsupported format'
					}`,
				);
			}

			if (error.response?.status === 403) {
				throw new Error('You do not have permission to upload files to this record');
			}

			if (error.response?.status === 404) {
				throw new Error(
					`Record with ID ${recordId} not found or field ${field} is not a file field`,
				);
			}

			if (error.response?.status === 413) {
				throw new Error('File is too large. SmartSuite has file size limits');
			}

			throw new Error(`Failed to upload file: ${error.message || 'Unknown error'}`);
		}
	},
});
