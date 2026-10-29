import { createAction, Property } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderApi } from '../../common/api';
import { senderTransactionalCampaignWriteOutputSchema } from '../../output-schemas';

export const senderCreateTransactionalCampaignAction = createAction({
	auth: senderAuth,
	name: 'sender_create_transactional_campaign',
	outputSchema: senderTransactionalCampaignWriteOutputSchema,
	displayName: 'Create Transactional Campaign',
	description: 'Creates a transactional email template.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a transactional campaign: a reusable email template with subject, sender and HTML or plain-text content. Reply To must be on a verified sending domain. Each call creates a separate template.',
		idempotent: false,
	},
	props: {
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Internal name shown in reports.',
			required: false,
		}),
		subject: Property.ShortText({ displayName: 'Subject', required: true }),
		from: Property.ShortText({
			displayName: 'From Name',
			description: 'Sender name shown to recipients.',
			required: true,
		}),
		replyTo: Property.ShortText({
			displayName: 'Reply To',
			description: 'Sender email address, on a verified domain in the account.',
			required: true,
		}),
		editor: Property.StaticDropdown({
			displayName: 'Editor',
			description:
				'html or plain to pass Content; builder creates a drag-and-drop template to finish in Sender.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'HTML', value: 'html' },
					{ label: 'Plain text', value: 'plain' },
					{ label: 'Builder', value: 'builder' },
				],
			},
		}),
		content: Property.LongText({
			displayName: 'Content',
			description: 'Email body as HTML or plain text, matching Editor.',
			required: false,
		}),
		preheader: Property.ShortText({
			displayName: 'Preheader',
			description: 'Preview text shown after the subject in inboxes.',
			required: false,
		}),
	},
	async run(context) {
		return await senderApi.createTransactionalCampaign({
			auth: context.auth,
			...context.propsValue,
		});
	},
});
