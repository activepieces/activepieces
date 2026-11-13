import { createAction } from '@activepieces/pieces-framework';

import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetJobStatusOutputSchema } from '../../../output-schemas';

export const mailjetGetBulkManageContactsJobAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_bulk_manage_contacts_job',
	outputSchema: mailjetJobStatusOutputSchema,
	displayName: 'Get Bulk Manage Contacts Job',
	description: 'Gets the status of a Bulk Manage Contacts job.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads the status, counts and error file of a job started by Bulk Manage Contacts. Call again until Status is Completed or Error.',
		idempotent: true,
	},
	props: {
		jobId: mailjetAiProps.id({
			displayName: 'Job ID',
			description: 'JobID returned by Bulk Manage Contacts.',
		}),
	},
	async run(context) {
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/contact/managemanycontacts/${encodeURIComponent(context.propsValue.jobId)}`,
		});
	},
});
