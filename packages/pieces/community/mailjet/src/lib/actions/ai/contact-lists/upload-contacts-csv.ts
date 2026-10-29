import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetCsvUploadOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetUploadContactsCsvAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_upload_contacts_csv',
	outputSchema: mailjetCsvUploadOutputSchema,
	displayName: 'Upload Contacts CSV',
	description: 'Uploads CSV contact data for a later import into a list.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Uploads CSV text (header row with email and property names, then one contact per row) for a contact list. Returns the data ID; then call Create CSV Import with it to run the import.',
		idempotent: false,
	},
	props: {
		listId: mailjetAiProps.id({
			displayName: 'Contact List ID',
			description: 'Numeric contact list ID the data is for, from List Contact Lists.',
		}),
		csv: Property.LongText({
			displayName: 'CSV',
			description: 'CSV text, e.g. "email,name\\njane@example.com,Jane".',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.uploadContactsCsv({ auth: context.auth, listId: p.listId, csv: p.csv });
	},
});
