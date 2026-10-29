import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetSavedTemplateContentOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetUpdateTemplateContentAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_update_template_content',
	outputSchema: mailjetSavedTemplateContentOutputSchema,
	displayName: 'Update Template Content',
	description: 'Updates the draft content of a template.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates the latest draft content of a template. Only the fields you set change. Fails when the content is locked (see Unlock Template Content).',
		idempotent: true,
	},
	props: {
		templateId: mailjetAiProps.id({
			displayName: 'Template ID',
			description: 'Numeric template ID, from List Templates or Create Template.',
		}),
		locale: Property.ShortText({
			displayName: 'Locale',
			description: 'Locale of the content, e.g. "en_US".',
			required: false,
		}),
		htmlPart: Property.LongText({
			displayName: 'HTML Part',
			description: 'HTML content.',
			required: false,
		}),
		textPart: Property.LongText({
			displayName: 'Text Part',
			description: 'Plain-text content.',
			required: false,
		}),
		mjmlPart: Property.LongText({
			displayName: 'MJML Part',
			description: 'MJML source, for MJML templates.',
			required: false,
		}),
		headers: Property.Object({
			displayName: 'Headers',
			description: 'Template headers such as Subject, SenderName, SenderEmail, Reply-To.',
			required: false,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Name of this content version.',
			required: false,
		}),
		author: Property.ShortText({
			displayName: 'Author',
			description: 'Who wrote this content.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.put({
			auth: context.auth,
			path: `/v1/REST/templates/${encodeURIComponent(p.templateId)}/contents/types/D`,
			body: {
				Locale: p.locale,
				HTMLPart: p.htmlPart,
				TextPart: p.textPart,
				MJMLPart: p.mjmlPart,
				Headers: p.headers,
				Name: p.name,
				Author: p.author,
			},
		});
	},
});
