import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookMessageActionOutputSchema } from '../output-schemas';

export const outlookRemoveMessageCategoriesAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_remove_message_categories',
	classification: 'WRITE',
	displayName: 'Remove Categories from Message',
	description: 'Removes categories (labels) from a message.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Removes one or more Outlook categories from a message while leaving its other categories intact. Use Add Categories to Message for the inverse, and Update Message when other fields change too. Idempotent: removing a category the message does not have changes nothing.',
		idempotent: true,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: outlookAtomicCommon.messageIdHint,
			required: true,
		}),
		categories: Property.Array({
			displayName: 'Categories to Remove',
			description: 'Category names to remove from the message.',
			required: true,
		}),
	},
	outputSchema: outlookMessageActionOutputSchema,
	async run(context) {
		const { messageId } = context.propsValue;
		const categories = context.propsValue.categories as string[];

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);
		const path = `${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}`;

		try {
			const current = await client.api(`${path}?$select=id,categories`).get();
			const existing = (current?.['categories'] ?? []) as string[];
			const remaining = existing.filter((category) => !categories.includes(category));

			return await client
				.api(path)
				.headers(outlookAtomicCommon.textBodyHeaders)
				.patch({ categories: remaining });
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Removing categories from the Outlook message',
			});
		}
	},
});
