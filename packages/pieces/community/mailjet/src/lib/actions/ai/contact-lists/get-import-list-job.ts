import { createAction } from '@activepieces/pieces-framework';

import { mailjetImportListJobOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetImportListJobAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_import_list_job',
	outputSchema: mailjetImportListJobOutputSchema,
	displayName: 'Get Import Contact List Job',
	description: 'Gets the status of an Import Contact List job.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads the status and counts of a job started by Import Contact List. Call again until it completes.',
		idempotent: true,
	},
	props: {
		listId: mailjetAiProps.id({
			displayName: 'Destination List ID',
			description: 'Numeric ID of the destination list used in Import Contact List.',
		}),
		jobId: mailjetAiProps.id({
			displayName: 'Job ID',
			description: 'JobID returned by Import Contact List.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/contactslist/${encodeURIComponent(p.listId)}/importlist/${encodeURIComponent(
				p.jobId,
			)}`,
		});
	},
});
