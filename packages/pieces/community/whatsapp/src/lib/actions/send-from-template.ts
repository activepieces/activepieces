import { whatsappAuth } from '../..';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { commonProps } from '../common/utils';

export const sendTemplateMessageAction = createAction({
	auth: whatsappAuth,
	name: 'send-template-message',
	displayName: 'Send Template Message',
	description: 'Sends a template message.',
	props: {
		phone_number_id: commonProps.phone_number_id,
		to: Property.ShortText({
			displayName: 'To',
			description: 'Recipient phone number.',
			required: true,
		}),
		message_template_id: commonProps.message_template_id,
		message_template_fields: commonProps.message_template_fields,
	},
	async run(context) {
		const phoneNumberId = context.propsValue.phone_number_id as string;
		const recipientPhoneNumber = context.propsValue.to as string;
		const templateId = context.propsValue.message_template_id as string;
		const templateFields = context.propsValue.message_template_fields;

		// construct components object
		// https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#components-object
		const components = [];
		const headerParameters = [];
		const bodyParameters = [];
		const buttonParameters = [];

		for (const [key, value] of Object.entries(templateFields)) {
			if (key.startsWith('header_')) {
				headerParameters.push({ type: 'text', text: value });
			} else if (key.startsWith('body_')) {
				bodyParameters.push({ type: 'text', text: value });
			} else if (key.startsWith('button_')) {
				buttonParameters.push({ type: 'text', text: value });
			}
		}

		if (headerParameters.length) {
			components.push({
				type: 'header',
				parameters: headerParameters,
			});
		}
		if (bodyParameters.length) {
			components.push({
				type: 'body',
				parameters: bodyParameters,
			});
		}
		if (buttonParameters.length) {
			components.push({
				type: 'button',
				sub_type: 'url',
				index: 0,
				parameters: buttonParameters,
			});
		}

		// fetch template language code
		const templateData = await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: `https://graph.facebook.com/v20.0/${templateId}`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
			queryParams: {
				fields: 'id,name,language',
			},
		});

		const templateLanguage = templateData.body['language'];
		const templateName = templateData.body['name'];

		// https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates/#text-based
		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
			body: {
				messaging_product: 'whatsapp',
				recipient_type: 'individual',
				to: recipientPhoneNumber,
				type: 'template',
				template: {
					name: templateName,
					language: {
						code: templateLanguage,
					},
					components,
				},
			},
		});

		return response.body;
	},
});
