import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { BodyType, Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookDraftMessageActionOutputSchema } from '../output-schemas';

export const outlookCreateDraftAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_create_draft',
	classification: 'WRITE',
	displayName: 'Create Draft',
	description: 'Creates an unsent draft message.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates an unsent draft email in the mailbox (optionally inside a specific folder) and returns its message ID. Use this to stage a message for review, to attach files with Add Attachment to Draft, or before Send Draft; use Send Email to send in one step. Not idempotent: every call creates another draft.',
		idempotent: false,
	},
	props: {
		recipients: Property.Array({
			displayName: 'To Email(s)',
			required: false,
		}),
		ccRecipients: Property.Array({
			displayName: 'CC Email(s)',
			required: false,
		}),
		bccRecipients: Property.Array({
			displayName: 'BCC Email(s)',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			required: true,
		}),
		bodyFormat: Property.StaticDropdown({
			displayName: 'Body Format',
			required: true,
			defaultValue: 'text',
			options: {
				disabled: false,
				options: [
					{ label: 'HTML', value: 'html' },
					{ label: 'Text', value: 'text' },
				],
			},
		}),
		body: Property.LongText({
			displayName: 'Body',
			required: true,
		}),
		folderId: Property.ShortText({
			displayName: 'Folder ID',
			description: `Create the draft inside a specific folder. ${outlookAtomicCommon.wellKnownFolderHint} Leave empty to use the Drafts folder.`,
			required: false,
		}),
		attachments: Property.Array({
			displayName: 'Attachments',
			description: 'Files to attach. Total message size must stay under 3 MB.',
			required: false,
			properties: {
				file: Property.File({
					displayName: 'File',
					required: true,
				}),
				fileName: Property.ShortText({
					displayName: 'File Name',
					required: false,
				}),
			},
		}),
	},
	outputSchema: outlookDraftMessageActionOutputSchema,
	async run(context) {
		const recipients = (context.propsValue.recipients ?? []) as string[];
		const ccRecipients = (context.propsValue.ccRecipients ?? []) as string[];
		const bccRecipients = (context.propsValue.bccRecipients ?? []) as string[];
		const attachments = (context.propsValue.attachments ?? []) as Array<{
			file: ApFile;
			fileName: string;
		}>;

		const { subject, body, bodyFormat, folderId } = context.propsValue;

		const mailPayload: Message = {
			subject,
			body: {
				content: body,
				contentType: bodyFormat as BodyType,
			},
			toRecipients: recipients.map((mail) => ({ emailAddress: { address: mail } })),
			ccRecipients: ccRecipients.map((mail) => ({ emailAddress: { address: mail } })),
			bccRecipients: bccRecipients.map((mail) => ({ emailAddress: { address: mail } })),
			attachments: attachments.map((attachment) => ({
				'@odata.type': '#microsoft.graph.fileAttachment',
				name: attachment.fileName || attachment.file.filename,
				contentBytes: attachment.file.base64,
			})),
		};

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);
		const path = folderId
			? `${prefix}/mailFolders/${outlookAtomicCommon.encodeGraphId(folderId)}/messages`
			: `${prefix}/messages`;

		try {
			return await client.api(path).post(mailPayload);
		} catch (error) {
			throw outlookAtomicCommon.graphError({ error, operation: 'Creating the Outlook draft' });
		}
	},
});
