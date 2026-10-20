import { createAction } from '@activepieces/pieces-framework';

import { mailjetCsvImportOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetCsvImportAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_csv_import',
	outputSchema: mailjetCsvImportOutputSchema,
	displayName: 'Get CSV Import',
	description: 'Gets the status of a CSV import job.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads the status and counts of an import job from Create CSV Import. Call again until Status is Completed or Error.',
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
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/csvimport/${encodeURIComponent(p.importJobId)}`,
		});
	},
});
