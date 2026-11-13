import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetSetCampaignDraftContentOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetSetCampaignDraftContentAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_set_campaign_draft_content',
	outputSchema: mailjetSetCampaignDraftContentOutputSchema,
	displayName: 'Set Campaign Draft Content',
	description: 'Sets the content of a campaign draft.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets the HTML and/or text content of a campaign draft, replacing what was there. Provide at least HTML Part or Text Part.',
		idempotent: true,
	},
	props: {
		draftId: mailjetAiProps.id({
			displayName: 'Campaign Draft ID',
			description: 'Numeric campaign draft ID, from List Campaign Drafts or Create Campaign Draft.',
		}),
		htmlPart: Property.LongText({
			displayName: 'HTML Part',
			description: 'HTML content of the campaign.',
			required: false,
		}),
		textPart: Property.LongText({
			displayName: 'Text Part',
			description: 'Plain-text content of the campaign.',
			required: false,
		}),
		headers: Property.Object({
			displayName: 'Headers',
			description: 'Headers as name/value pairs; they override settings such as Subject.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: `/v3/REST/campaigndraft/${encodeURIComponent(p.draftId)}/detailcontent`,
			body: {
				'Html-part': p.htmlPart,
				'Text-part': p.textPart,
				Headers: p.headers,
			},
		});
	},
});
