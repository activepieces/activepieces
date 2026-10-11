import { createAction, Property } from '@activepieces/pieces-framework';
import { FollowupFlagStatus, Importance, Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { describeBatchFailure, GraphBatchRequest, runGraphBatch } from '../common/graph-batch';
import { outlookBatchUpdateMessagesActionOutputSchema } from '../output-schemas';

export const outlookBatchUpdateMessagesAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_batch_update_messages',
	classification: 'WRITE',
	displayName: 'Batch Update Messages',
	description: 'Applies the same property changes to several messages at once.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Applies the same read state, flag, importance and category changes to many messages through Microsoft Graph batching, in chunks of 20 sub-requests. Fields left empty are never sent, and categories are merged per message against that message current categories, so tags on other messages are not wiped. Individual items can fail while others succeed, so always read the failed list. Idempotent: re-applying the same field values converges on the same state and creates no new entities.',
		idempotent: true,
	},
	props: {
		messageIds: Property.Array({
			displayName: 'Message IDs',
			description: 'IDs of the messages to update. Resolve them with List Messages or Search Messages.',
			required: true,
		}),
		isRead: Property.StaticDropdown({
			displayName: 'Read State',
			description: 'Leave unset to keep each message current read state.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Mark as read', value: 'true' },
					{ label: 'Mark as unread', value: 'false' },
				],
			},
		}),
		flagStatus: Property.StaticDropdown({
			displayName: 'Flag State',
			description: 'Leave unset to keep each message current flag.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Flagged', value: 'flagged' },
					{ label: 'Not flagged', value: 'notFlagged' },
					{ label: 'Complete', value: 'complete' },
				],
			},
		}),
		importance: Property.StaticDropdown({
			displayName: 'Importance',
			description: 'Leave unset to keep each message current importance.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Low', value: 'low' },
					{ label: 'Normal', value: 'normal' },
					{ label: 'High', value: 'high' },
				],
			},
		}),
		categoriesToAdd: Property.Array({
			displayName: 'Categories to Add',
			description: 'Category names merged into the categories each message already has.',
			required: false,
		}),
		categoriesToRemove: Property.Array({
			displayName: 'Categories to Remove',
			description: 'Category names removed from each message.',
			required: false,
		}),
	},
	outputSchema: outlookBatchUpdateMessagesActionOutputSchema,
	async run(context) {
		const { isRead, flagStatus, importance } = context.propsValue;
		const messageIds = (context.propsValue.messageIds ?? []) as string[];
		const categoriesToAdd = (context.propsValue.categoriesToAdd ?? []) as string[];
		const categoriesToRemove = (context.propsValue.categoriesToRemove ?? []) as string[];

		if (messageIds.length === 0) {
			throw new Error('Batch updating Outlook messages failed: no message IDs were supplied.');
		}

		const basePayload: Message = {};
		if (isRead !== undefined) {
			basePayload.isRead = isRead === 'true';
		}
		if (flagStatus !== undefined) {
			basePayload.flag = { flagStatus: flagStatus as FollowupFlagStatus };
		}
		if (importance !== undefined) {
			basePayload.importance = importance as Importance;
		}

		const changesCategories = categoriesToAdd.length > 0 || categoriesToRemove.length > 0;

		if (Object.keys(basePayload).length === 0 && !changesCategories) {
			throw new Error(
				'Batch updating Outlook messages failed: no fields were supplied, so there is nothing to change.',
			);
		}

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		const failed: Array<{ messageId: string; status: number; error: string }> = [];
		const mergedCategories = new Map<string, string[]>();

		try {
			if (changesCategories) {
				const readRequests: GraphBatchRequest[] = messageIds.map((messageId, index) => ({
					id: String(index + 1),
					method: 'GET',
					url: `${prefix}/messages/${outlookAtomicCommon.encodeGraphId(
						messageId,
					)}?$select=id,categories`,
				}));

				const readResponses = await runGraphBatch({ client, requests: readRequests });

				for (const response of readResponses) {
					const messageId = messageIds[Number(response.id) - 1];
					if (response.status >= 200 && response.status < 300) {
						const body = (response.body ?? {}) as { categories?: string[] };
						const existing = body.categories ?? [];
						mergedCategories.set(
							messageId,
							[...new Set([...existing, ...categoriesToAdd])].filter(
								(category) => !categoriesToRemove.includes(category),
							),
						);
					} else {
						failed.push({
							messageId,
							status: response.status,
							error: describeBatchFailure(response),
						});
					}
				}
			}

			const targets = changesCategories
				? messageIds.filter((messageId) => mergedCategories.has(messageId))
				: messageIds;

			const patchRequests: GraphBatchRequest[] = targets.map((messageId, index) => ({
				id: String(index + 1),
				method: 'PATCH',
				url: `${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}`,
				headers: { 'Content-Type': 'application/json' },
				body: changesCategories
					? { ...basePayload, categories: mergedCategories.get(messageId) }
					: { ...basePayload },
			}));

			const succeeded: Array<{ messageId: string }> = [];

			if (patchRequests.length > 0) {
				const patchResponses = await runGraphBatch({ client, requests: patchRequests });

				for (const response of patchResponses) {
					const messageId = targets[Number(response.id) - 1];
					if (response.status >= 200 && response.status < 300) {
						succeeded.push({ messageId });
					} else {
						failed.push({
							messageId,
							status: response.status,
							error: describeBatchFailure(response),
						});
					}
				}
			}

			return {
				success: failed.length === 0,
				requestedCount: messageIds.length,
				succeededCount: succeeded.length,
				failedCount: failed.length,
				succeeded,
				failed,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({ error, operation: 'Batch updating Outlook messages' });
		}
	},
});
