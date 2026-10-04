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
			'Stores the raw RFC-822 MIME source of one Outlook message, including full internet headers, as a byte-exact .eml file and returns that file plus its size. The content is not returned inline, because MIME can carry 8-bit and non-UTF-8 bytes that no text field round-trips; read the file when you need the headers. Use this for archival or forensic inspection; use Get Message when the parsed fields are enough. Read-only and safe to retry.',
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
			const bytes = await client
				.api(`${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}/$value`)
				.responseType(ResponseType.ARRAYBUFFER)
				.get();

			const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
			const fileName = 'message.eml';

			const file = await context.files.write({
				fileName,
				data: buffer,
			});

			return {
				messageId,
				fileName,
				contentType: 'message/rfc822',
				size: buffer.length,
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
