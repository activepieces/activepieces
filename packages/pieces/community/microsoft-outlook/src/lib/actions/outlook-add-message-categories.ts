import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookMessageActionOutputSchema } from '../output-schemas';

export const outlookAddMessageCategoriesAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_add_message_categories',
	classification: 'WRITE',
	displayName: 'Add Categories to Message',
	description: 'Adds categories (labels) to a message.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Adds one or more Outlook categories to a message, merging them with the categories already on it so nothing is overwritten. Use Remove Categories from Message for the inverse, and Update Message when other fields change too. Idempotent: re-adding the same categories leaves the message unchanged.',
		idempotent: true,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: outlookAtomicCommon.messageIdHint,
			required: true,
		}),
		categories: Property.Array({
			displayName: 'Categories',
			description: 'Category names to add to the message.',
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
			const merged = [...new Set([...existing, ...categories])];

			return await client
				.api(path)
				.headers(outlookAtomicCommon.textBodyHeaders)
				.patch({ categories: merged });
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Adding categories to the Outlook message',
			});
		}
	},
});
