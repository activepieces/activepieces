import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsappAuth } from '../auth';
import { commonProps } from '../common/utils';
import { whatsappProps } from '../common/props';
import { whatsappClient } from '../common/client';
import { editMessageTemplateOutputSchema } from '../output-schemas';

export const editMessageTemplate = createAction({
	auth: whatsappAuth,
	name: 'edit_message_template',
	outputSchema: editMessageTemplateOutputSchema,
	classification: 'WRITE',
	displayName: 'Edit Message Template',
	description: 'Replaces the components of an existing template and resubmits it for review.',
	audience: 'both',
	aiMetadata: {
		description:
			'Edits an existing WhatsApp message template by replacing all of its components, optionally changing its category, and resubmits it for Meta review. Only APPROVED, REJECTED or PAUSED templates can be edited, and the whole components array is replaced rather than merged, so pass every component you want to keep. Idempotent — resending the same components converges on the same template.',
		idempotent: true,
	},
	props: {
		message_template_id: commonProps.message_template_id,
		components: whatsappProps.templateComponents,
		category: Property.StaticDropdown({
			displayName: 'Category',
			description: 'Leave empty to keep the current category.',
			required: false,
			options: {
				options: [
					{ label: 'Marketing', value: 'MARKETING' },
					{ label: 'Utility', value: 'UTILITY' },
					{ label: 'Authentication', value: 'AUTHENTICATION' },
				],
			},
		}),
	},
	async run(context) {
		const { message_template_id, components, category } = context.propsValue;
		return whatsappClient.request<{ success: boolean }>({
			accessToken: context.auth.props.access_token,
			method: HttpMethod.POST,
			path: `/${message_template_id}`,
			body: {
				components: whatsappClient.normalizeTemplateComponents(components),
				...(category ? { category } : {}),
			},
		});
	},
});
