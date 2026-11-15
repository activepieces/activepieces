import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteReportOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteReportAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_report',
	outputSchema: mauticDeleteReportOutputSchema,
	displayName: 'Delete Report',
	description: 'Permanently deletes a Mautic report.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a report. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Report Id',
			description: 'Numeric report id, from List Reports or Create Report.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'reports',
			id: context.propsValue.id,
		});
	},
});
