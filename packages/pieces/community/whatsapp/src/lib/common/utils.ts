import {
	AuthenticationType,
	httpClient,
	HttpMethod,
	QueryParams,
} from '@activepieces/pieces-common';
import { whatsappAuth } from '../../';
import {
	Property,
	PiecePropValueSchema,
	DynamicPropsValue,
	DropdownOption,
} from '@activepieces/pieces-framework';

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

			const options: DropdownOption<string>[] = [];

			let hasMore = false;
			let cursor;

			do {
				const qs: QueryParams = {
					fields: 'verified_name,id,display_phone_number',
					limit: '1',
				};
				if (cursor) qs['after'] = cursor;

				const response = await httpClient.sendRequest({
					method: HttpMethod.GET,
					url: `https://graph.facebook.com/v20.0/${authValue.businessAccountId}/phone_numbers`,
					authentication: {
						type: AuthenticationType.BEARER_TOKEN,
						token: authValue.access_token,
					},
					queryParams: qs,
				});

				for (const phoneNumber of response.body.data) {
					options.push({
						label: `${phoneNumber.verified_name as string} : ${
							phoneNumber.display_phone_number as string
						}`,
						value: phoneNumber.id as string,
					});
				}

				if (response.body.paging.next) {
					(hasMore = true), (cursor = response.body.paging.cursors.after);
				} else {
					hasMore = false;
				}
			} while (hasMore);

			return {
				disabled: false,
				options,
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

			const options: DropdownOption<string>[] = [];

			let hasMore = false;
			let cursor;

			do {
				const qs: QueryParams = {
					fields: 'id,name,language',
					limit: '1',
				};
				if (cursor) qs['after'] = cursor;

				const response = await httpClient.sendRequest({
					method: HttpMethod.GET,
					url: `https://graph.facebook.com/v20.0/${authValue.businessAccountId}/message_templates`,
					authentication: {
						type: AuthenticationType.BEARER_TOKEN,
						token: authValue.access_token,
					},
					queryParams: qs,
				});

				for (const template of response.body.data) {
					options.push({
						label: `${template.name as string} (${template.language as string})`,
						value: template.id as string,
					});
				}

				if (response.body.paging.next) {
					(hasMore = true), (cursor = response.body.paging.cursors.after);
				} else {
					hasMore = false;
				}
			} while (hasMore);

			return {
				disabled: false,
				options,
			};
		},
	}),

	message_template_fields: Property.DynamicProperties({
		displayName: 'Template Fields',
		refreshers: ['message_template_id'],
		required: true,
		props: async ({ auth, message_template_id }) => {
			if (!auth) return {};
			if (!message_template_id) return {};

			const authValue = auth as PiecePropValueSchema<typeof whatsappAuth>;
			const templateId = message_template_id as unknown as string;

			const response = await httpClient.sendRequest({
				url: `https://graph.facebook.com/v20.0/${templateId}`,
				method: HttpMethod.GET,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: authValue.access_token,
				},
			});

			const bodyComponentFields: DynamicPropsValue = {};
			const headerComponentFields: DynamicPropsValue = {};
			const buttonComponentFields: DynamicPropsValue = {};

			for (const component of response.body.components) {
				if (component.type === 'BODY') {
					// https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components#syntax
					bodyComponentFields['BODY_markdown'] = Property.MarkDown({
						value: `
						**Body :**
						${component.text}`,
					});

					const bodyTextVariables = component.text?.match(/{{(\d+)}}/g) ?? [];

					for (let i = 0; i < bodyTextVariables.length; i++) {
						bodyComponentFields[`body_{{${i + 1}}}`] = Property.ShortText({
							displayName: `Body {{${i + 1}}}`,
							required: false,
						});
					}
				} else if (component.type === 'HEADER' && component.format === 'TEXT') {
					// https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components#text-headers
					headerComponentFields['HEADER_markdown'] = Property.MarkDown({
						value: `
						**Header :**
						${component.text}`,
					});

					const headerTextVariables = component.text?.match(/{{(\d+)}}/g) ?? [];

					for (let i = 0; i < headerTextVariables.length; i++) {
						headerComponentFields[`header_{{${i + 1}}}`] = Property.ShortText({
							displayName: `Header {{${i + 1}}}`,
							required: false,
						});
					}
				} else if (component.type === 'BUTTONS') {
					// https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components#url-buttons
					for (const button of component.buttons) {
						if (button.type === 'URL') {
							const buttonURLTextVariables = button.url?.match(/{{(\d+)}}/g) ?? [];

							for (let i = 0; i < buttonURLTextVariables.length; i++) {
								buttonComponentFields[`button_{{${i + 1}}}`] = Property.ShortText({
									displayName: button.text,
									required: false,
								});
							}
						}
					}
				}
			}

			const templateFields: DynamicPropsValue = {
				...headerComponentFields,
				...bodyComponentFields,
				...buttonComponentFields,
			};

			return templateFields;
		},
	}),
};
