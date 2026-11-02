import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsappAuth } from '../auth';
import { commonProps } from '../common/utils';
import { whatsappClient } from '../common/client';
import { deleteMessageTemplateOutputSchema } from '../output-schemas';

export const deleteMessageTemplate = createAction({
	auth: whatsappAuth,
	name: 'delete_message_template',
	outputSchema: deleteMessageTemplateOutputSchema,
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Message Template',
	description: 'Deletes a message template from the business account.',
	audience: 'both',
	aiMetadata: {
		description:
			'Deletes one WhatsApp message template, selected by id, from the business account. Deleting an approved template blocks reuse of its name for 30 days, and templates with messages still in flight move to PENDING_DELETION first. Not idempotent — a second call for the same template fails because it no longer exists.',
		idempotent: false,
	},
	props: {
		message_template_id: commonProps.message_template_id,
	},
	async run(context) {
		const accessToken = context.auth.props.access_token;
		const templateId = context.propsValue.message_template_id;
		const template = await whatsappClient.request<{ id: string; name: string }>({
			accessToken,
			method: HttpMethod.GET,
			path: `/${templateId}`,
			queryParams: { fields: 'id,name' },
		});
		return whatsappClient.request<{ success: boolean }>({
			accessToken,
			method: HttpMethod.DELETE,
			path: `/${context.auth.props.businessAccountId}/message_templates`,
			queryParams: { hsm_id: template.id, name: template.name },
		});
	},
});
