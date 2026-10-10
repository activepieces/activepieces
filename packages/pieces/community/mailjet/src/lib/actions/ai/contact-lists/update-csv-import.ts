import { createAction } from '@activepieces/pieces-framework';

import { mailjetCsvImportOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetUpdateCsvImportAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_update_csv_import',
	outputSchema: mailjetCsvImportOutputSchema,
	displayName: 'Abort CSV Import',
	description: 'Aborts a running CSV import job.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Aborts a CSV import job that is still running by setting its status to Abort. Jobs that already finished cannot be aborted.',
		idempotent: true,
	},
	props: {
		importJobId: mailjetAiProps.id({
			displayName: 'Import Job ID',
			description: 'Import job ID returned by Create CSV Import.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.put({
			auth: context.auth,
			path: `/v3/REST/csvimport/${encodeURIComponent(p.importJobId)}`,
			body: { Status: 'Abort' },
		});
	},
});
