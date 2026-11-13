import { createAction, Property } from '@activepieces/pieces-framework';

import { opnformAuth } from '../../../auth';
import { opnformAiProps } from '../../../common/ai-props';
import { opnformApi } from '../../../common/api';
import { opnformExportSubmissionsOutputSchema } from '../../../output-schemas';

export const opnformExportSubmissionsAction = createAction({
	auth: opnformAuth,
	name: 'opnform_export_submissions',
	outputSchema: opnformExportSubmissionsOutputSchema,
	displayName: 'Export Submissions',
	description: "Exports a form's submissions as CSV.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Exports a form's submissions as CSV. Small forms return the CSV text right away (`is_async` false); large forms instead start a background export job (`is_async` true) and return its `job_id`, with no CSV.",
		idempotent: false,
	},
	props: {
		formId: opnformAiProps.formId({ required: true }),
		columns: Property.Json({
			displayName: 'Columns',
			description:
				'JSON object of the columns to include, keyed by field id (from Get Form) or system column, with true to include, e.g. {"3700d380-197b-47b9-a008-3acc31bbd506": true, "created_at": true}.',
			required: true,
		}),
	},
	async run(context) {
		const { formId, columns } = context.propsValue;
		const response = await opnformApi.exportSubmissions({ auth: context.auth, formId, columns });
		if (typeof response === 'string') {
			return { is_async: false, csv: response, job_id: null, message: null };
		}
		return {
			is_async: true,
			csv: null,
			job_id: response.job_id ?? null,
			message: response.message ?? null,
		};
	},
});
