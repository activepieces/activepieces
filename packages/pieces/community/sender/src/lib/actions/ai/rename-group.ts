import { createAction, Property } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderSuccessOutputSchema } from '../../output-schemas';

export const senderRenameGroupAction = createAction({
	auth: senderAuth,
	name: 'sender_rename_group',
	outputSchema: senderSuccessOutputSchema,
	displayName: 'Rename Group',
	description: 'Renames a group.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Changes the title of an existing subscriber group. Membership is not affected.',
		idempotent: true,
	},
	props: {
		groupId: senderAiProps.groupId({ required: true }),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'New name for the group.',
			required: true,
		}),
	},
	async run(context) {
		return await senderApi.renameGroup({ auth: context.auth, ...context.propsValue });
	},
});
