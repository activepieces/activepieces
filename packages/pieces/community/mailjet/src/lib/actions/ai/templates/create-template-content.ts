import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetSavedTemplateContentOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetCreateTemplateContentAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_create_template_content',
	outputSchema: mailjetSavedTemplateContentOutputSchema,
	displayName: 'Create Template Content',
	description: 'Adds a new draft content version to a template.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Saves a new draft content version (HTML, text and/or MJML plus headers) for a template. Provide at least one of HTML Part, Text Part or MJML Part. Publish it with Publish Template Content.',
		idempotent: false,
	},
	props: {
		templateId: mailjetAiProps.id({
			displayName: 'Template ID',
			description: 'Numeric template ID, from List Templates or Create Template.',
		}),
		locale: Property.ShortText({
			displayName: 'Locale',
			description: 'Locale of the content, e.g. "en_US".',
			required: true,
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
		return await mailjetApi.post({
			auth: context.auth,
			path: `/v1/REST/templates/${encodeURIComponent(p.templateId)}/contents`,
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
