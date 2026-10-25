import { createAction, Property } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderTransactionalCampaignWriteOutputSchema } from '../../output-schemas';

export const senderUpdateTransactionalCampaignAction = createAction({
	auth: senderAuth,
	name: 'sender_update_transactional_campaign',
	outputSchema: senderTransactionalCampaignWriteOutputSchema,
	displayName: 'Update Transactional Campaign',
	description: 'Updates a transactional email template.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates the title, subject, sender, reply-to, editor type or preheader of a transactional campaign. Only the values you set change. Reply To must be on a verified sending domain.',
		idempotent: true,
	},
	props: {
		campaignId: senderAiProps.transactionalCampaignId({ required: true }),
		title: Property.ShortText({ displayName: 'Title', required: false }),
		subject: Property.ShortText({ displayName: 'Subject', required: false }),
		from: Property.ShortText({ displayName: 'From Name', required: false }),
		replyTo: Property.ShortText({
			displayName: 'Reply To',
			description: 'Sender email address, on a verified domain in the account.',
			required: false,
		}),
		editor: Property.StaticDropdown({
			displayName: 'Editor',
			description:
				'html or plain to pass Content; builder creates a drag-and-drop template to finish in Sender.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'HTML', value: 'html' },
					{ label: 'Plain text', value: 'plain' },
					{ label: 'Builder', value: 'builder' },
				],
			},
		}),
		preheader: Property.ShortText({ displayName: 'Preheader', required: false }),
	},
	async run(context) {
		return await senderApi.updateTransactionalCampaign({
			auth: context.auth,
			...context.propsValue,
		});
	},
});
