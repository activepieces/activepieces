import { createAction } from '@activepieces/pieces-framework';

import { mailjetCsvImportErrorsOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetCsvImportErrorsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_csv_import_errors',
	outputSchema: mailjetCsvImportErrorsOutputSchema,
	displayName: 'Get CSV Import Errors',
	description: 'Gets the rows a CSV import rejected.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the CSV text of the rows a CSV import job rejected, with the error per row. Use the import job ID from Create CSV Import.',
		idempotent: true,
	},
	props: {
		jobId: mailjetAiProps.id({
			displayName: 'Import Job ID',
			description: 'Import job ID returned by Create CSV Import.',
		}),
	},
	async run(context) {
		return await mailjetApi.getCsvImportErrors({
			auth: context.auth,
			jobId: context.propsValue.jobId,
		});
	},
});
