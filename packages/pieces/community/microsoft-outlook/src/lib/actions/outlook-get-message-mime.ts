import { createAction, Property } from '@activepieces/pieces-framework';
import { ResponseType } from '@microsoft/microsoft-graph-client';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookGetMessageMimeActionOutputSchema } from '../output-schemas';

export const outlookGetMessageMimeAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_get_message_mime',
	classification: 'READ',
	displayName: 'Get Message MIME Content',
	description: 'Downloads the raw MIME (RFC-822) content of a message.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the raw RFC-822 MIME source of one Outlook message, including full internet headers, and stores it as an .eml file. Use this for header analysis, archival or forensic inspection; use Get Message when the parsed fields are enough. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: outlookAtomicCommon.messageIdHint,
			required: true,
		}),
	},
	outputSchema: outlookGetMessageMimeActionOutputSchema,
	async run(context) {
		const { messageId } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			const raw = await client
				.api(`${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}/$value`)
				.responseType(ResponseType.TEXT)
				.get();

			const mimeContent = typeof raw === 'string' ? raw : String(raw);

			const file = await context.files.write({
				fileName: 'message.eml',
				data: Buffer.from(mimeContent, 'utf-8'),
			});

			return {
				messageId,
				contentType: 'message/rfc822',
				size: Buffer.byteLength(mimeContent, 'utf-8'),
				mimeContent,
				file,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Downloading the Outlook message MIME content',
			});
		}
	},
});
