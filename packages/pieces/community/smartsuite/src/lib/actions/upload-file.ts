import { Property, createAction } from '@activepieces/pieces-framework';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon } from '../common/props';
import { smartSuiteClient } from '../common/client';
import { recordFiles } from '../common/record-files';
import { outputSchemas } from '../output-schemas';

export const uploadFile = createAction({
	name: 'upload_file',
	classification: 'WRITE',
	displayName: 'Upload File',
	description: 'Uploads a file and attaches it to a record.',
	audience: 'human',
	aiMetadata: {
		description: 'Uploads a file to a Files & Images field picked from the table schema, then returns the files now in that field. Agents should use Attach File to Record (by ID). Not idempotent: each call adds another attachment.',
		idempotent: false,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		recordId: smartsuiteCommon.recordId,
		field: smartsuiteCommon.tableFieldDropdown({
			displayName: 'File Field',
			description: 'The Files & Images field to attach the file to.',
			required: true,
			onlyTypes: ['filefield'],
		}),
		file: Property.File({
			displayName: 'File',
			description: 'The file to upload (up to 100 MB).',
			required: true,
		}),
	},
	outputSchema: outputSchemas['uploadFile'],
	async run({ auth, propsValue }) {
		const { recordId, field, tableId, file } = propsValue;
		return recordFiles.attach({ credentials: smartSuiteClient.credentialsOf(auth), tableId, recordId, field, file });
	},
});
