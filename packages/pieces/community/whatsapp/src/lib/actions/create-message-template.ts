import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsappAuth } from '../auth';
import { whatsappProps } from '../common/props';
import { whatsappClient } from '../common/client';
import { createMessageTemplateOutputSchema } from '../output-schemas';

export const createMessageTemplate = createAction({
	auth: whatsappAuth,
	name: 'create_message_template',
	outputSchema: createMessageTemplateOutputSchema,
	classification: 'WRITE',
	displayName: 'Create Message Template',
	description: 'Submits a new message template for Meta review.',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates a WhatsApp message template on the business account and submits it for Meta approval; it returns the new template id and a PENDING status, and Template Status Updated fires when review completes. Names must be lowercase letters, digits and underscores, unique per language. Not idempotent — a duplicate name for the same language is rejected rather than reused.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Lowercase letters, digits and underscores only, for example order_update.',
			required: true,
			width: 'half',
		}),
		language: Property.ShortText({
			displayName: 'Language',
			description: 'Language and locale code, for example en_US.',
			required: true,
			width: 'half',
		}),
		category: whatsappProps.templateCategory,
		components: whatsappProps.templateComponents,
	},
	propertyGroups: [
		{ key: 'template', display: 'section', label: 'Template', icon: 'file', props: ['name', 'language', 'category'] },
		{ key: 'content', display: 'section', label: 'Content', icon: 'code', props: ['components'] },
	],
	async run(context) {
		const { name, language, category, components } = context.propsValue;
		return whatsappClient.request<{ id: string; status: string; category: string }>({
			accessToken: context.auth.props.access_token,
			method: HttpMethod.POST,
			path: `/${context.auth.props.businessAccountId}/message_templates`,
			body: { name, language, category, components: whatsappClient.normalizeTemplateComponents(components) },
		});
	},
});
