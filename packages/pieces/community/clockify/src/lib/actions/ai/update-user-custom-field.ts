import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { userCustomFieldValueOutputSchema } from '../../output-schemas';

export const updateUserCustomFieldAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_user_custom_field',
	outputSchema: userCustomFieldValueOutputSchema,
	displayName: 'Update User Custom Field',
	description: "Sets the value of a user's custom field.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets the value of a user-level custom field for one workspace member. Needs workspace admin and a Clockify plan with custom fields (Pro or higher). Get the field ID from List Custom Fields.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		userId: clockifyAiProps.userId({ required: true }),
		customFieldId: clockifyAiProps.customFieldId({ required: true }),
		value: Property.ShortText({
			displayName: 'Value',
			description: 'The new value of the field.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.updateUserCustomField({
			auth,
			workspaceId: propsValue.workspaceId,
			userId: propsValue.userId,
			customFieldId: propsValue.customFieldId,
			value: propsValue.value,
		});
	},
});
