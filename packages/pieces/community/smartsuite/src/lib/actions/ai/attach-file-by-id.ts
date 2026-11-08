import { Property, createAction } from '@activepieces/pieces-framework';
import { smartsuiteAuth } from '../../auth';
import { smartSuiteClient } from '../../common/client';
import { smartSuiteInputs } from '../../common/inputs';
import { recordFiles } from '../../common/record-files';
import { outputSchemas } from '../../output-schemas';

export const attachFileByIdAi = createAction({
	name: 'attach_file_by_id',
	classification: 'WRITE',
	displayName: 'Attach File to Record (by ID)',
	description: 'Uploads a file into a Files & Images field of a record, by IDs and field slug.',
	audience: 'ai',
	aiMetadata: {
		description: 'Uploads one file (a file URL or file from an earlier step, up to 100 MB) into a Files & Images field of a SmartSuite record, given Table ID, Record ID and the field slug (field_type filefield in Get Table Schema (by ID)). Returns the files now in that field with their handles. Not idempotent: each call adds another attachment.',
		idempotent: false,
	},
	auth: smartsuiteAuth,
	props: {
		tableId: smartSuiteInputs.aiProps.tableId(),
		recordId: smartSuiteInputs.aiProps.recordId(),
		fieldSlug: Property.ShortText({
			displayName: 'File Field Slug',
			description: 'Slug of a Files & Images field. Get it from Get Table Schema.',
			required: true,
		}),
		file: Property.File({
			displayName: 'File',
			description: 'The file to upload (up to 100 MB).',
			required: true,
		}),
	},
	outputSchema: outputSchemas['uploadFile'],
	async run({ auth, propsValue }) {
		return recordFiles.attach({
			credentials: smartSuiteClient.credentialsOf(auth),
			tableId: propsValue.tableId,
			recordId: propsValue.recordId,
			field: smartSuiteInputs.requireText({ value: propsValue.fieldSlug, label: 'File Field Slug' }),
			file: propsValue.file,
		});
	},
});
