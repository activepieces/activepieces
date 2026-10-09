import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetCsvImportOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetCreateCsvImportAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_create_csv_import',
	outputSchema: mailjetCsvImportOutputSchema,
	displayName: 'Create CSV Import',
	description: 'Starts importing uploaded CSV contact data into a list.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Starts an import job for CSV data uploaded with Upload Contacts CSV. Returns the import job; read its progress with Get CSV Import and failed rows with Get CSV Import Errors.',
		idempotent: false,
	},
	props: {
		contactsListId: Property.Number({
			displayName: 'Contact List ID',
			description: 'Numeric ID of the list to import into; the same list the CSV was uploaded for.',
			required: true,
		}),
		dataId: Property.Number({
			displayName: 'Data ID',
			description: 'ID returned by Upload Contacts CSV.',
			required: true,
		}),
		method: mailjetAiProps.listAction({
			description: 'What to do with each imported contact in the list.',
		}),
		importOptions: Property.ShortText({
			displayName: 'Import Options',
			description:
				'Optional JSON string of import options, e.g. {"DateTimeFormat":"yyyy-mm-dd","TimezoneOffset":2,"FieldNames":["email","name"]}.',
			required: false,
		}),
		errorThreshold: Property.Number({
			displayName: 'Error Threshold',
			description: 'Number of row errors after which the import is aborted.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: '/v3/REST/csvimport',
			body: {
				ContactsListID: p.contactsListId,
				DataID: p.dataId,
				Method: p.method,
				ImportOptions: p.importOptions,
				ErrTreshold: p.errorThreshold,
			},
		});
	},
});
