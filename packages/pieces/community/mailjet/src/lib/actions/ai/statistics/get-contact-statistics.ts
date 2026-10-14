import { createAction } from '@activepieces/pieces-framework';

import { mailjetContactStatisticsOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetContactStatisticsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_contact_statistics',
	outputSchema: mailjetContactStatisticsOutputSchema,
	displayName: 'Get Contact Statistics',
	description: 'Gets the sending and engagement counts of one contact.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets how many messages one contact was sent, opened, clicked, bounced or marked spam.',
		idempotent: true,
	},
	props: {
		contactId: mailjetAiProps.id({
			displayName: 'Contact ID or Email',
			description: 'Numeric contact ID (from List Contacts) or the contact email.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/contactstatistics/${encodeURIComponent(p.contactId)}`,
		});
	},
});
