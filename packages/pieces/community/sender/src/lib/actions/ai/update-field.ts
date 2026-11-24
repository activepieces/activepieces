import { createAction, Property } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderUtils } from '../../common/utils';
import { senderSuccessOutputSchema } from '../../output-schemas';

export const senderUpdateFieldAction = createAction({
	auth: senderAuth,
	name: 'sender_update_field',
	outputSchema: senderSuccessOutputSchema,
	displayName: 'Update Field',
	description: 'Renames a custom field or shows or hides it.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Renames a custom subscriber field and/or sets whether it shows as a filter in the subscribers dashboard. Only the values you set change; the field type cannot be changed. Renaming also changes the key used to write values ("Company size" becomes "{$company_size}"), so read it again with List Fields before writing values.',
		idempotent: true,
	},
	props: {
		fieldId: senderAiProps.fieldId({ required: true }),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'New field name.',
			required: false,
		}),
		show: senderAiProps.yesNo({
			required: false,
			displayName: 'Show in Dashboard',
			description: 'Show the field as a filter in the subscribers dashboard.',
		}),
	},
	async run(context) {
		const { fieldId, title, show } = context.propsValue;
		return await senderApi.updateField({
			auth: context.auth,
			fieldId,
			title,
			show: senderUtils.yesNoToBoolean(show),
		});
	},
});
