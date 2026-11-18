import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetTemplateOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListTemplatesAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_templates',
	outputSchema: mailjetTemplateOutputSchema,
	displayName: 'List Templates',
	description: 'Lists email templates.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists email templates with their IDs, names and ExternalID (the ID used as Template ID in Send Email once the template is published). Filter by name, publish state or label. Page with Limit and Offset.',
		idempotent: true,
	},
	props: {
		partialName: Property.ShortText({
			displayName: 'Name Contains',
			description: 'Only templates whose name contains this text.',
			required: false,
		}),
		isPublished: mailjetAiProps.yesNo({
			displayName: 'Published',
			description: 'Yes for published templates only, No for unpublished.',
		}),
		isStarred: mailjetAiProps.yesNo({
			displayName: 'Starred',
			description: 'Yes for starred templates only.',
		}),
		locale: Property.ShortText({
			displayName: 'Locale',
			description: 'Only templates in this locale, e.g. "en_US".',
			required: false,
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v1/REST/templates',
			query: {
				PartialName: p.partialName,
				IsPublished: p.isPublished,
				IsStarred: p.isStarred,
				Locale: p.locale,
				...mailjetUtils.pagingQuery(p),
			},
		});
	},
});
