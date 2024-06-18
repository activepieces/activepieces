import {
	AuthenticationType,
	httpClient,
	HttpMethod,
	HttpRequest,
} from '@activepieces/pieces-common';
import { whatsappAuth } from '../../';
import { Property, PiecePropValueSchema, DynamicPropsValue } from '@activepieces/pieces-framework';

export const supportedMediaTypes = ['image', 'audio', 'document', 'sticker', 'video'];
export const capitalizeFirstLetter = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
export const mediaTypeSupportsCaption = (type: string) =>
	['image', 'video', 'document'].includes(type);

export const commonProps = {
	phone_number_id: Property.Dropdown({
		displayName: 'Phone Number ID',
		description: 'Phone number ID that will be used to send the message.',
		refreshers: [],
		required: true,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					placeholder: 'Please connect account first',
					disabled: true,
					options: [],
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof whatsappAuth>;

			const request: HttpRequest = {
				method: HttpMethod.GET,
				url: `https://graph.facebook.com/v20.0/${authValue.businessAccountId}/phone_numbers`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: authValue.access_token,
				},
			};

			const response = await httpClient.sendRequest(request);

			return {
				disabled: false,
				options: response.body.data.map(
					(phoneNumber: { verified_name: string; display_phone_number: string; id: string }) => {
						return {
							label: `${phoneNumber.verified_name}:${phoneNumber.display_phone_number}`,
							value: phoneNumber.id,
						};
					},
				),
			};
		},
	}),
	message_template_id: Property.Dropdown({
		displayName: 'Message Template ID',
		refreshers: [],
		required: true,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					placeholder: 'Please connect account first',
					disabled: true,
					options: [],
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof whatsappAuth>;

			const request: HttpRequest = {
				method: HttpMethod.GET,
				url: `https://graph.facebook.com/v20.0/${authValue.businessAccountId}/message_templates`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: authValue.access_token,
				},
				queryParams: {
					fields: 'id,name,language',
				},
			};

			const response = await httpClient.sendRequest(request);

			return {
				disabled: false,
				options: response.body.data.map(
					(template: { name: string; language: string; id: string }) => {
						return {
							label: template.name,
							value: template.id,
						};
					},
				),
			};
		},
	}),

	// message_template_fields: Property.DynamicProperties({
	// 	displayName: 'Template Fields',
	// 	refreshers: ['message_template_id'],
	// 	required: true,
	// 	props: async ({ auth, message_template_id }) => {
	// 		if (!auth) return {};
	// 		if (!message_template_id) return {};

	// 		const fields: DynamicPropsValue = {};

	// 		const authValue = auth as PiecePropValueSchema<typeof whatsappAuth>;
	// 		const templateId = message_template_id as unknown as string;

	// 		const response = await httpClient.sendRequest({
	// 			url: `https://graph.facebook.com/v20.0/${templateId}`,
	// 			method: HttpMethod.GET,
	// 			authentication: {
	// 				type: AuthenticationType.BEARER_TOKEN,
	// 				token: authValue.access_token,
	// 			},
	// 		});

	// 		for (const component of response.body.components) {
	// 			if (component.type === 'BODY') {
	// 			}
	// 		}

	// 		return fields;
	// 	},
	// }),
};
