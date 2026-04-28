import { DynamicPropsValue, Property, createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { googleDocsAuth, createGoogleClient } from '../auth';
import { buildDocUrl } from '../common';
import { documentIdProp } from '../common/props';

type ShareType = 'user' | 'group' | 'domain' | 'anyone';

export const shareDocument = createAction({
	auth: googleDocsAuth,
	name: 'share_document',
	displayName: 'Share Document',
	description: 'Share a Google Doc with another user by email, with a domain, or with anyone who has the link.',
	props: {
		documentId: documentIdProp('Document', 'The Google Doc to share.'),
		shareType: Property.StaticDropdown<ShareType>({
			displayName: 'Share With',
			description: 'Choose who to share the document with.',
			required: true,
			defaultValue: 'user',
			options: {
				disabled: false,
				options: [
					{ label: 'Specific user (by email)', value: 'user' },
					{ label: 'Specific group (by email)', value: 'group' },
					{ label: 'Entire domain', value: 'domain' },
					{ label: 'Anyone with the link', value: 'anyone' },
				],
			},
		}),
		recipient: Property.DynamicProperties({
			auth: googleDocsAuth,
			displayName: 'Recipient',
			required: true,
			refreshers: ['shareType'],
			props: async ({ shareType }) => {
				const type = (shareType as unknown as string) ?? 'user';
				const fields: DynamicPropsValue = {};
				if (type === 'user' || type === 'group') {
					fields['email'] = Property.ShortText({
						displayName: 'Email Address',
						description: `The ${type}'s email address to share with.`,
						required: true,
					});
					fields['sendNotificationEmail'] = Property.Checkbox({
						displayName: 'Send notification email',
						description: 'Notify the recipient by email when sharing.',
						required: false,
						defaultValue: true,
					});
					fields['emailMessage'] = Property.LongText({
						displayName: 'Email Message',
						description: 'Optional message included in the notification email.',
						required: false,
					});
				} else if (type === 'domain') {
					fields['domain'] = Property.ShortText({
						displayName: 'Domain',
						description: 'The domain to share with (e.g. `example.com`).',
						required: true,
					});
				}
				return fields;
			},
		}),
		role: Property.StaticDropdown({
			displayName: 'Permission',
			description: 'The access level to grant.',
			required: true,
			defaultValue: 'reader',
			options: {
				disabled: false,
				options: [
					{ label: 'Viewer', value: 'reader' },
					{ label: 'Commenter', value: 'commenter' },
					{ label: 'Editor', value: 'writer' },
				],
			},
		}),
	},
	async run(context) {
		const documentId = context.propsValue.documentId as string;
		const shareType = context.propsValue.shareType as ShareType;
		const role = context.propsValue.role as string;
		const details = context.propsValue.recipient ?? {};

		const email = (details['email'] as string | undefined)?.trim();
		const domain = (details['domain'] as string | undefined)?.trim();
		const sendNotificationEmail = Boolean(details['sendNotificationEmail'] ?? true);
		const emailMessage = details['emailMessage'] as string | undefined;

		if ((shareType === 'user' || shareType === 'group') && !email) {
			throw new Error(`Email Address is required when sharing with a ${shareType}.`);
		}
		if (shareType === 'domain' && !domain) {
			throw new Error('Domain is required when sharing with an entire domain.');
		}

		const authClient = await createGoogleClient(context.auth);
		const drive = google.drive({ version: 'v3', auth: authClient });

		const permission = await drive.permissions.create({
			fileId: documentId,
			supportsAllDrives: true,
			sendNotificationEmail: shareType === 'anyone' || shareType === 'domain' ? false : sendNotificationEmail,
			emailMessage: emailMessage || undefined,
			fields: '*',
			requestBody: {
				role: role as string,
				type: shareType as string,
				emailAddress: shareType === 'user' || shareType === 'group' ? email : undefined,
				domain: shareType === 'domain' ? domain : undefined,
			},
		});

		return {
			documentId,
			url: buildDocUrl(documentId),
			permissionId: permission.data.id,
			role: permission.data.role,
			type: permission.data.type,
			emailAddress: permission.data.emailAddress,
			domain: permission.data.domain,
			raw: permission.data,
		};
	},
});
