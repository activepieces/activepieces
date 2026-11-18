import { createAction } from '@activepieces/pieces-framework';

import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetJobStatusOutputSchema } from '../../../output-schemas';

export const mailjetGetBulkManageListContactsJobAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_bulk_manage_list_contacts_job',
	outputSchema: mailjetJobStatusOutputSchema,
	displayName: 'Get Bulk Manage List Contacts Job',
	description: 'Gets the status of a Bulk Manage List Contacts job.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads the status, counts and errors of a job started by Bulk Manage List Contacts. Call again until Status is Completed or Error.',
		idempotent: true,
	},
	props: {
		listId: mailjetAiProps.id({
			displayName: 'Contact List ID',
			description: 'Numeric contact list ID, from List Contact Lists or Create Contact List.',
		}),
		jobId: mailjetAiProps.id({
			displayName: 'Job ID',
			description: 'JobID returned by Bulk Manage List Contacts.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/contactslist/${encodeURIComponent(
				p.listId,
			)}/managemanycontacts/${encodeURIComponent(p.jobId)}`,
		});
	},
});
