import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookGetMailTipsActionOutputSchema } from '../output-schemas';

const mailTipsOptions =
	'automaticReplies, mailboxFullStatus, customMailTip, externalMemberCount, maxMessageSize, deliveryRestriction, moderationStatus, recipientScope, totalMemberCount';

export const outlookGetMailTipsAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_get_mail_tips',
	classification: 'READ',
	displayName: 'Get Mail Tips',
	description: 'Reads pre-send mail tips for a set of recipients.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Checks recipients before sending and reports automatic replies or out-of-office messages, full mailboxes, maximum accepted message size, delivery restrictions, moderation and whether the recipient is external. Use this ahead of Send Email when a message is important or goes outside the organisation. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		emailAddresses: Property.Array({
			displayName: 'Recipient Email Addresses',
			description: 'Addresses to check. Up to 100 recipients per call.',
			required: true,
		}),
	},
	outputSchema: outlookGetMailTipsActionOutputSchema,
	async run(context) {
		const emailAddresses = context.propsValue.emailAddresses as string[];

		if (emailAddresses.length === 0) {
			throw new Error('Reading Outlook mail tips failed: no recipient addresses were supplied.');
		}

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			const response = await client.api(`${prefix}/getMailTips`).post({
				EmailAddresses: emailAddresses,
				MailTipsOptions: mailTipsOptions,
			});

			const mailTips = (response?.['value'] ?? []) as Array<Record<string, unknown>>;

			return {
				mailTips,
				count: mailTips.length,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({ error, operation: 'Reading Outlook mail tips' });
		}
	},
});
