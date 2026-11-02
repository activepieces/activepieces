import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookMessageActionOutputSchema } from '../output-schemas';

export const outlookGetMessageAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_get_message',
	classification: 'READ',
	displayName: 'Get Message',
	description: 'Retrieves a single message by its ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reads one Outlook message by ID and returns its headers, plain-text body and metadata. Use this after List Messages or Search Messages to inspect a specific email; use Get Message MIME Content when you need the raw RFC-822 source. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: outlookAtomicCommon.messageIdHint,
			required: true,
		}),
	},
	outputSchema: outlookMessageActionOutputSchema,
	async run(context) {
		const { messageId } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			return await client
				.api(`${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}`)
				.headers(outlookAtomicCommon.textBodyHeaders)
				.get();
		} catch (error) {
			throw outlookAtomicCommon.graphError({ error, operation: 'Reading the Outlook message' });
		}
	},
});
