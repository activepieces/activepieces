import { createAction, Property } from '@activepieces/pieces-framework';
import { Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookCommon } from '../common/client';
import { messageIdDropdown } from '../common/props';
import { forwardEmailActionOutputSchema } from '../output-schemas';

export const forwardEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'forwardEmail',
	classification: 'WRITE',
	displayName: 'Forward Email',
	description: 'Forward an email to new recipients with an optional note.',
	audience: 'both',
	aiMetadata: { description: 'Forwards an existing Outlook message (by message ID) to new recipients, preserving the original body and attachments and prepending an optional comment. Use this to pass an existing email along rather than composing a new one. Not idempotent: each call sends a new forwarded email.', idempotent: false },
	outputSchema: forwardEmailActionOutputSchema,
	props: {
		messageId: messageIdDropdown({
			displayName: 'Email',
			description: 'The email to forward.',
			required: true,
		}),
		recipients: Property.Array({
			displayName: 'To',
			description: 'One address per row.',
			required: true,
		}),
		comment: Property.LongText({
			displayName: 'Comment',
			description: 'Added above the forwarded email. HTML tags are rendered.',
			required: false,
		}),
	},
	async run(context) {
		const { messageId, comment } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);

		const message = await client.api(`${outlookCommon.mailboxPrefix(context.auth)}/messages/${messageId}`).get();

		const messagePayload: Message = {
			toRecipients: outlookCommon.toRecipients(context.propsValue.recipients),
			body: {
				contentType: 'html',
				content: (comment ?? '') + '<br><br>' + message.body.content,
			},
			attachments: message.attachments,
		};

		await client
			.api(`${outlookCommon.mailboxPrefix(context.auth)}/messages/${messageId}/forward`)
			.post({
				message:messagePayload,
			});

		return {
			success: true,
			message: 'Email forwarded successfully.',
			messageId,
		};
	},
});
