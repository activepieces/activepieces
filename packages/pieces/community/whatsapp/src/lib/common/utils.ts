import {
	AuthenticationType,
	httpClient,
	HttpMethod,
	QueryParams,
} from '@activepieces/pieces-common';
import { whatsappAuth } from '../auth';
import {
	Property,
	DynamicPropsValue,
	DropdownOption,
} from '@activepieces/pieces-framework';

export const supportedMediaTypes = ['image', 'audio', 'document', 'sticker', 'video'];
export const capitalizeFirstLetter = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
export const mediaTypeSupportsCaption = (type: string) =>
	['image', 'video', 'document'].includes(type);

export const commonProps = {
	phone_number_id: phoneNumberDropdown({ required: true }),
	message_template_id: Property.Dropdown({
		displayName: 'Message Template ID',
		refreshers: [],
		required: true,
		auth: whatsappAuth,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					placeholder: 'Please connect account first',
					disabled: true,
					options: [],
				};
			}

			const authValue = auth.props;

			const options: DropdownOption<string>[] = [];

			let cursor: string | undefined;

			do {
				const qs: QueryParams = {
					fields: 'id,name,language',
					limit: String(DROPDOWN_PAGE_SIZE),
				};
				if (cursor) qs['after'] = cursor;

				const response = await httpClient.sendRequest<GraphPage<MessageTemplateRow>>({
					method: HttpMethod.GET,
					url: `${WHATSAPP_API_BASE}/${authValue.businessAccountId}/message_templates`,
					authentication: {
						type: AuthenticationType.BEARER_TOKEN,
						token: authValue.access_token,
					},
					queryParams: qs,
				});

				for (const template of response.body.data ?? []) {
					options.push({
						label: `${template.name} (${template.language})`,
						value: template.id,
					});
				}

				cursor = nextCursor(response.body);
			} while (cursor && options.length < DROPDOWN_MAX_OPTIONS);

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
		auth: whatsappAuth,
			props: async ({ auth, message_template_id }) => {
			if (!auth) return {};
			if (!message_template_id) return {};

			const authValue = auth.props;
			const templateId = message_template_id as unknown as string;

			const response = await httpClient.sendRequest({
				url: `${WHATSAPP_API_BASE}/${templateId}`,
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


function nextCursor<T>(page: GraphPage<T>): string | undefined {
	return page.paging?.next ? page.paging.cursors?.after : undefined;
}

export function phoneNumberDropdown<R extends boolean>({ required }: { required: R }) {
	return Property.Dropdown({
		auth: whatsappAuth,
		displayName: 'Phone Number ID',
		description: 'Phone number ID that will be used to send the message.',
		refreshers: [],
		required,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					placeholder: 'Please connect account first',
					disabled: true,
					options: [],
				};
			}

			const authValue = auth.props;

			const options: DropdownOption<string>[] = [];

			let cursor: string | undefined;

			do {
				const qs: QueryParams = {
					fields: 'verified_name,id,display_phone_number',
					limit: String(DROPDOWN_PAGE_SIZE),
				};
				if (cursor) qs['after'] = cursor;

				const response = await httpClient.sendRequest<GraphPage<PhoneNumberRow>>({
					method: HttpMethod.GET,
					url: `${WHATSAPP_API_BASE}/${authValue.businessAccountId}/phone_numbers`,
					authentication: {
						type: AuthenticationType.BEARER_TOKEN,
						token: authValue.access_token,
					},
					queryParams: qs,
				});

				for (const phoneNumber of response.body.data ?? []) {
					options.push({
						label: `${phoneNumber.verified_name} : ${phoneNumber.display_phone_number}`,
						value: phoneNumber.id,
					});
				}

				cursor = nextCursor(response.body);
			} while (cursor && options.length < DROPDOWN_MAX_OPTIONS);

			return {
				disabled: false,
				options,
			};
		},
	});
}

export const WHATSAPP_API_BASE = 'https://graph.facebook.com/v23.0';

const DROPDOWN_PAGE_SIZE = 100;
const DROPDOWN_MAX_OPTIONS = 1000;

type GraphPage<T> = {
	data?: T[];
	paging?: { next?: string; cursors?: { after?: string } };
};

type PhoneNumberRow = { id: string; verified_name: string; display_phone_number: string };
type MessageTemplateRow = { id: string; name: string; language: string };
