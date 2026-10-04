import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { describeBatchFailure, GraphBatchRequest, runGraphBatch } from '../common/graph-batch';
import { outlookBatchMoveMessagesActionOutputSchema } from '../output-schemas';

export const outlookBatchMoveMessagesAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_batch_move_messages',
	classification: 'WRITE',
	displayName: 'Batch Move Messages',
	description: 'Moves several messages to one folder in a single batched call.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Moves many messages into the same destination folder using Microsoft Graph batching, in chunks of 20 sub-requests. Every moved message gets a NEW ID, returned per item, and the original IDs stop resolving. Individual items can fail while others succeed, so always read the failed list. Use Move Message for a single message. Not idempotent: a retry with the old IDs fails.',
		idempotent: false,
	},
	props: {
		messageIds: Property.Array({
			displayName: 'Message IDs',
			description: 'IDs of the messages to move. Resolve them with List Messages or Search Messages.',
			required: true,
		}),
		destinationFolderId: Property.ShortText({
			displayName: 'Destination Folder ID',
			description: outlookAtomicCommon.wellKnownFolderHint,
			required: true,
		}),
	},
	outputSchema: outlookBatchMoveMessagesActionOutputSchema,
	async run(context) {
		const { destinationFolderId } = context.propsValue;
		const messageIds = (context.propsValue.messageIds ?? []) as string[];

		if (messageIds.length === 0) {
			throw new Error('Batch moving Outlook messages failed: no message IDs were supplied.');
		}

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		const requests: GraphBatchRequest[] = messageIds.map((messageId, index) => ({
			id: String(index + 1),
			method: 'POST',
			url: `${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}/move`,
			headers: { 'Content-Type': 'application/json' },
			body: { destinationId: destinationFolderId },
		}));

		try {
			const responses = await runGraphBatch({ client, requests });

			const succeeded: Array<{ messageId: string; newMessageId: string | null }> = [];
			const failed: Array<{ messageId: string; status: number; error: string }> = [];

			for (const response of responses) {
				const messageId = messageIds[Number(response.id) - 1];
				if (response.status >= 200 && response.status < 300) {
					const body = (response.body ?? {}) as { id?: string };
					succeeded.push({ messageId, newMessageId: body.id ?? null });
				} else {
					failed.push({
						messageId,
						status: response.status,
						error: describeBatchFailure(response),
					});
				}
			}

			return {
				success: failed.length === 0,
				destinationFolderId,
				requestedCount: messageIds.length,
				succeededCount: succeeded.length,
				failedCount: failed.length,
				succeeded,
				failed,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({ error, operation: 'Batch moving Outlook messages' });
		}
	},
});
