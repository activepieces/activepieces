import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookCommon } from '../common/client';
import { messageIdDropdown } from '../common/props';
import { messageActionOutputSchema } from '../output-schemas';

export const addLabelToEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'addLabelToEmail',
	classification: 'WRITE',
	displayName: 'Add Label to Email',
	description: 'Tag an email with one or more Outlook categories.',
	audience: 'both',
	aiMetadata: { description: 'Adds one or more Outlook categories (labels) to a specific message, merging them with any categories already present. Use this to tag or classify an email. Idempotent: re-adding the same categories leaves the message unchanged since duplicates are de-duplicated.', idempotent: true },
	outputSchema: messageActionOutputSchema,
	props: {
		messageId: messageIdDropdown({
			displayName: 'Email',
			description: 'The email to tag.',
			required: true,
		}),
		categories: Property.Array({
			displayName: 'Categories',
			description: 'Category names to add, one per row.',
			required: true,
		}),
	},
	async run(context) {
		const { messageId, categories } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);

		const message = await client.api(`${outlookCommon.mailboxPrefix(context.auth)}/messages/${messageId}`).get();
		const existingCategories = message.categories || [];

		const updatedCategories = [...new Set([...existingCategories, ...categories])];

		const response = await client.api(`${outlookCommon.mailboxPrefix(context.auth)}/messages/${messageId}`).patch({
			categories: updatedCategories,
		});
		
		return response;
	},
});
