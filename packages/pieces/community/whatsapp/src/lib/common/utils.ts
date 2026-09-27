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
	MarkdownVariant,
} from '@activepieces/pieces-framework';

export const supportedMediaTypes = ['image', 'audio', 'document', 'sticker', 'video'];
export const capitalizeFirstLetter = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
export const mediaTypeSupportsCaption = (type: string) =>
	['image', 'video', 'document'].includes(type);

export const commonProps = {
	phone_number_id: Property.Dropdown({
		auth: whatsappAuth,
		displayName: 'From Phone Number',
		description: 'The business number the message is sent from.',
		refreshers: [],
		required: true,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					placeholder: 'Please connect your account first',
					disabled: true,
					options: [],
				};
			}

			const authValue = auth.props;

			const options: DropdownOption<string>[] = [];

			let hasMore = false;
			let cursor: string | undefined;

			do {
				const qs: QueryParams = {
					fields: 'verified_name,id,display_phone_number',
					limit: '100',
				};
				if (cursor) qs['after'] = cursor;

				const response = await httpClient.sendRequest<PhoneNumbersPage>({
					method: HttpMethod.GET,
					url: `https://graph.facebook.com/v20.0/${authValue.businessAccountId}/phone_numbers`,
					authentication: {
						type: AuthenticationType.BEARER_TOKEN,
						token: authValue.access_token,
					},
					queryParams: qs,
				});

				for (const phoneNumber of response.body.data ?? []) {
					options.push({
						label: `${phoneNumber.verified_name} (${phoneNumber.display_phone_number})`,
						value: phoneNumber.id,
					});
				}

				const nextPage = response.body.paging?.next;
				const nextCursor = response.body.paging?.cursors?.after;

				if (nextPage && nextCursor) {
					hasMore = true;
					cursor = nextCursor;
				} else {
					hasMore = false;
				}
			} while (hasMore);

			if (options.length === 0) {
				return {
					placeholder: 'No phone numbers found in this account',
					disabled: false,
					options: [],
				};
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	message_template_id: Property.Dropdown({
		displayName: 'Template',
		description: 'Only templates approved by WhatsApp are delivered.',
		refreshers: [],
		required: true,
		auth: whatsappAuth,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					placeholder: 'Please connect your account first',
					disabled: true,
					options: [],
				};
			}

			const authValue = auth.props;

			const options: DropdownOption<string>[] = [];

			let hasMore = false;
			let cursor: string | undefined;

			do {
				const qs: QueryParams = {
					fields: 'id,name,language',
					limit: '100',
				};
				if (cursor) qs['after'] = cursor;

				const response = await httpClient.sendRequest<TemplatesPage>({
					method: HttpMethod.GET,
					url: `https://graph.facebook.com/v20.0/${authValue.businessAccountId}/message_templates`,
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

				const nextPage = response.body.paging?.next;
				const nextCursor = response.body.paging?.cursors?.after;

				if (nextPage && nextCursor) {
					hasMore = true;
					cursor = nextCursor;
				} else {
					hasMore = false;
				}
			} while (hasMore);

			if (options.length === 0) {
				return {
					placeholder: 'No message templates found',
					disabled: false,
					options: [],
				};
			}

			return {
				disabled: false,
				options,
			};
		},
	}),

	message_template_fields: Property.DynamicProperties({
		displayName: 'Template Fields',
		description: 'Fill in each placeholder of the selected template.',
		refreshers: ['message_template_id'],
		required: true,
		auth: whatsappAuth,
		props: async ({ auth, message_template_id }) => {
			if (!auth) return {};
			if (!message_template_id) return {};

			const authValue = auth.props;
			const templateId = String(message_template_id);

			const response = await httpClient.sendRequest<TemplateDetails>({
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

			for (const component of response.body.components ?? []) {
				if (component.type === 'BODY') {
					bodyComponentFields['BODY_markdown'] = Property.MarkDown({
						value: `**Body**\n\n${escapeTemplatePlaceholders(component.text ?? '')}`,
						variant: MarkdownVariant.BORDERLESS,
					});

					const bodyTextVariables = component.text?.match(/{{(\d+)}}/g) ?? [];

					for (let i = 0; i < bodyTextVariables.length; i++) {
						bodyComponentFields[`body_{{${i + 1}}}`] = Property.ShortText({
							displayName: `Body {{${i + 1}}}`,
							required: false,
						});
					}
				} else if (component.type === 'HEADER' && component.format === 'TEXT') {
					headerComponentFields['HEADER_markdown'] = Property.MarkDown({
						value: `**Header**\n\n${escapeTemplatePlaceholders(component.text ?? '')}`,
						variant: MarkdownVariant.BORDERLESS,
					});

					const headerTextVariables = component.text?.match(/{{(\d+)}}/g) ?? [];

					for (let i = 0; i < headerTextVariables.length; i++) {
						headerComponentFields[`header_{{${i + 1}}}`] = Property.ShortText({
							displayName: `Header {{${i + 1}}}`,
							required: false,
						});
					}
				} else if (component.type === 'BUTTONS') {
					for (const button of component.buttons ?? []) {
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

function escapeTemplatePlaceholders(text: string) {
	return text.replace(/{{(\d+)}}/g, '`{`{$1`}`}');
}

type Paging = {
	next?: string;
	cursors?: {
		after?: string;
	};
};

type PhoneNumbersPage = {
	data?: {
		id: string;
		verified_name: string;
		display_phone_number: string;
	}[];
	paging?: Paging;
};

type TemplatesPage = {
	data?: {
		id: string;
		name: string;
		language: string;
	}[];
	paging?: Paging;
};

type TemplateDetails = {
	components?: {
		type: string;
		format?: string;
		text?: string;
		buttons?: {
			type: string;
			text: string;
			url?: string;
		}[];
	}[];
};
