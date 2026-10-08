import { createAction } from '@activepieces/pieces-framework';

import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticRecordEmailReplyAction = createAction({
	auth: mauticAuth,
	name: 'mautic_record_email_reply',
	displayName: 'Record Email Reply',
	description: 'Marks a sent Mautic email as replied.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Records that the contact replied to a sent email, identified by the tracking hash of that send (from the contact activity or email stats). Each call adds a reply record.',
		idempotent: false,
	},
	props: {
		trackingHash: mauticAiProps.recordId({
			displayName: 'Tracking Hash',
			description:
				'Tracking hash of the sent email, from List Contact Activity (email.sent events).',
		}),
	},
	async run(context) {
		return await mauticApi.recordEmailReply({
			auth: context.auth,
			trackingHash: context.propsValue.trackingHash,
		});
	},
});
