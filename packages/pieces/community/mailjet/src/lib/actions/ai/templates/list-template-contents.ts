import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetTemplateContentOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListTemplateContentsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_template_contents',
	outputSchema: mailjetTemplateContentOutputSchema,
	displayName: 'List Template Contents',
	description: 'Lists the content versions of a template.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the draft and published content versions of a template.',
		idempotent: true,
	},
	props: {
		templateId: mailjetAiProps.id({
			displayName: 'Template ID',
			description: 'Numeric template ID, from List Templates or Create Template.',
		}),
		locale: Property.ShortText({
			displayName: 'Locale',
			description: 'Only content in this locale.',
			required: false,
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v1/REST/templates/${encodeURIComponent(p.templateId)}/contents`,
			query: { Locale: p.locale, ...mailjetUtils.pagingQuery(p) },
		});
	},
});
