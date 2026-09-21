import { createAction, Property } from '@activepieces/pieces-framework';
import { BodyType, FollowupFlagStatus, Importance, Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookMessageActionOutputSchema } from '../output-schemas';

export const outlookUpdateMessageAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_update_message',
	classification: 'WRITE',
	displayName: 'Update Message',
	description: 'Updates the writable properties of a message.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates one message in place: read state, flag state, importance and categories on any message, plus subject and body on a draft. Fields left empty are not sent, and categories are merged with the ones already on the message instead of replacing them. Use Mark Message Read / Unread for the read flag alone, or Batch Update Messages for many messages at once. Idempotent: re-applying the same values converges on the same state.',
		idempotent: true,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: outlookAtomicCommon.messageIdHint,
			required: true,
		}),
		isRead: Property.StaticDropdown({
			displayName: 'Read State',
			description: 'Leave unset to keep the current read state.',
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
			description: 'Leave unset to keep the current flag.',
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
			description: 'Leave unset to keep the current importance.',
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
			description: 'Category names to add, merged with the categories already on the message.',
			required: false,
		}),
		categoriesToRemove: Property.Array({
			displayName: 'Categories to Remove',
			description: 'Category names to remove from the message.',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Only writable while the message is still a draft.',
			required: false,
		}),
		body: Property.LongText({
			displayName: 'Body',
			description: 'Only writable while the message is still a draft.',
			required: false,
		}),
		bodyFormat: Property.StaticDropdown({
			displayName: 'Body Format',
			description: 'Format of the new body. Ignored when no body is supplied.',
			required: false,
			defaultValue: 'text',
			options: {
				disabled: false,
				options: [
					{ label: 'HTML', value: 'html' },
					{ label: 'Text', value: 'text' },
				],
			},
		}),
	},
	outputSchema: outlookMessageActionOutputSchema,
	async run(context) {
		const { messageId, isRead, flagStatus, importance, subject, body, bodyFormat } =
			context.propsValue;
		const categoriesToAdd = (context.propsValue.categoriesToAdd ?? []) as string[];
		const categoriesToRemove = (context.propsValue.categoriesToRemove ?? []) as string[];

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);
		const path = `${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}`;

		const payload: Message = {};

		if (isRead !== undefined) {
			payload.isRead = isRead === 'true';
		}
		if (flagStatus !== undefined) {
			payload.flag = { flagStatus: flagStatus as FollowupFlagStatus };
		}
		if (importance !== undefined) {
			payload.importance = importance as Importance;
		}
		if (subject !== undefined) {
			payload.subject = subject;
		}
		if (body !== undefined) {
			payload.body = { content: body, contentType: (bodyFormat ?? 'text') as BodyType };
		}

		const changesCategories = categoriesToAdd.length > 0 || categoriesToRemove.length > 0;

		try {
			if (changesCategories) {
				const current = await client.api(`${path}?$select=id,categories`).get();
				const existing = (current?.['categories'] ?? []) as string[];
				const merged = [...new Set([...existing, ...categoriesToAdd])].filter(
					(category) => !categoriesToRemove.includes(category),
				);
				payload.categories = merged;
			}

			if (Object.keys(payload).length === 0) {
				throw new Error(
					'Updating the Outlook message failed: no fields were supplied, so there is nothing to change.',
				);
			}

			return await client.api(path).headers(outlookAtomicCommon.textBodyHeaders).patch(payload);
		} catch (error) {
			if (error instanceof Error && error.message.startsWith('Updating the Outlook message')) {
				throw error;
			}
			throw outlookAtomicCommon.graphError({ error, operation: 'Updating the Outlook message' });
		}
	},
});
