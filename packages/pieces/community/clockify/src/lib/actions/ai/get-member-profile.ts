import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { memberProfileOutputSchema } from '../../output-schemas';

export const getMemberProfileAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_get_member_profile',
	outputSchema: memberProfileOutputSchema,
	displayName: 'Get Member Profile',
	description: "Gets a workspace member's profile.",
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Returns a workspace member's profile: name, email, week start, daily work capacity, working days and user custom field values.",
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		userId: clockifyAiProps.userId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.getMemberProfile({
			auth,
			workspaceId: propsValue.workspaceId,
			userId: propsValue.userId,
		});
	},
});
