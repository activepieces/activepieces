import { createAction } from '@activepieces/pieces-framework';

import { mailjetVerifyListJobOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetVerifyListJobAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_verify_list_job',
	outputSchema: mailjetVerifyListJobOutputSchema,
	displayName: 'Get Verify Contact List Job',
	description: 'Gets the status of a contact list verification job.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads the status and results of a job started by Verify Contact List. Call again until it completes.',
		idempotent: true,
	},
	props: {
		listId: mailjetAiProps.id({
			displayName: 'Contact List ID',
			description: 'Numeric contact list ID, from List Contact Lists or Create Contact List.',
		}),
		jobId: mailjetAiProps.id({
			displayName: 'Job ID',
			description: 'Job ID returned by Verify Contact List.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/contactslist/${encodeURIComponent(p.listId)}/verify/${encodeURIComponent(
				p.jobId,
			)}`,
		});
	},
});
