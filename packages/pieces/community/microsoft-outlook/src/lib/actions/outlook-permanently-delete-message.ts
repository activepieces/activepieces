import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';

export const outlookPermanentlyDeleteMessageAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_permanently_delete_message',
	classification: 'DESTRUCTIVE',
	displayName: 'Permanently Delete Message',
	description: 'Permanently deletes a message so it cannot be recovered.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently removes one message from the mailbox with no way to recover it, bypassing Deleted Items. Prefer Delete Message (to Deleted Items) in every case where recovery might be wanted; only use this when the caller explicitly asked for unrecoverable deletion. Unavailable on US Government DoD and 21Vianet clouds. Not idempotent: a retry with the same ID fails.',
		idempotent: false,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: outlookAtomicCommon.messageIdHint,
			required: true,
		}),
		confirm: Property.Checkbox({
			displayName: 'Confirm Permanent Deletion',
			description: 'Must be enabled. The message cannot be recovered afterwards.',
			required: true,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { messageId, confirm } = context.propsValue;

		if (!confirm) {
			throw new Error(
				'Permanently deleting the Outlook message was refused: enable Confirm Permanent Deletion to proceed, or use Delete Message (to Deleted Items) instead.',
			);
		}

		if (outlookAtomicCommon.isGovernmentCloud(context.auth)) {
			throw new Error(
				'Permanently deleting the Outlook message is not available on the US Government cloud. Use Delete Message (to Deleted Items) instead.',
			);
		}

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);
		const encodedMessageId = outlookAtomicCommon.encodeGraphId(messageId);

		try {
			await client.api(`${prefix}/messages/${encodedMessageId}/permanentDelete`).post({});

			return {
				success: true,
				message: 'Message permanently deleted.',
				messageId,
			};
		} catch (error) {
			const retryableAsUserPath =
				prefix === '/me' && outlookAtomicCommon.isUnsupportedMePathError(error);

			if (!retryableAsUserPath) {
				throw outlookAtomicCommon.graphError({
					error,
					operation: 'Permanently deleting the Outlook message',
				});
			}

			try {
				const profile = await client.api('/me?$select=id').get();
				const userId = profile?.['id'] as string | undefined;

				if (!userId) {
					throw outlookAtomicCommon.graphError({
						error,
						operation: 'Permanently deleting the Outlook message',
					});
				}

				await client
					.api(
						`/users/${outlookAtomicCommon.encodeGraphId(
							userId,
						)}/messages/${encodedMessageId}/permanentDelete`,
					)
					.post({});

				return {
					success: true,
					message: 'Message permanently deleted.',
					messageId,
				};
			} catch (fallbackError) {
				throw outlookAtomicCommon.graphError({
					error: fallbackError,
					operation: `Permanently deleting the Outlook message (retried against /users/{id} after the /me path was rejected with: ${outlookAtomicCommon.graphErrorDetail(
						error,
					)})`,
				});
			}
		}
	},
});
