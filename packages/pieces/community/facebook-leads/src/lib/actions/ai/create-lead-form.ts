import { createAction, Property } from '@activepieces/pieces-framework';

import { facebookLeadsAuth } from '../../auth';
import { facebookLeadsAiProps } from '../../common/ai-props';
import { facebookLeadsApi } from '../../common/api';
import { facebookLeadsCreateLeadFormOutputSchema } from '../../output-schemas';

export const createLeadFormAction = createAction({
	auth: facebookLeadsAuth,
	name: 'facebook_leads_create_lead_form',
	outputSchema: facebookLeadsCreateLeadFormOutputSchema,
	displayName: 'Create Lead Form',
	description: 'Creates a lead form on a Facebook Page.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a lead form (instant form) on a Facebook Page and returns its ID. A published form cannot be edited or deleted afterwards, only archived with Update Lead Form Status. The Page must have accepted the Lead Ads terms.',
		idempotent: false,
	},
	props: {
		pageId: facebookLeadsAiProps.pageId({ required: true }),
		name: Property.ShortText({
			displayName: 'Form Name',
			description: 'Internal name of the form, shown in Ads Manager.',
			required: true,
		}),
		questions: Property.Json({
			displayName: 'Questions',
			description:
				'JSON array of questions. Standard fields only need a type, e.g. [{"type":"FULL_NAME"},{"type":"EMAIL"},{"type":"PHONE"}]. Custom questions use {"type":"CUSTOM","key":"budget","label":"What is your budget?"}, with "options":[{"key":"low","value":"Under $1k"}] for multiple choice.',
			required: true,
		}),
		privacyPolicyUrl: Property.ShortText({
			displayName: 'Privacy Policy URL',
			description: 'Link to the advertiser privacy policy. Required by Facebook.',
			required: true,
		}),
		privacyPolicyLinkText: Property.ShortText({
			displayName: 'Privacy Policy Link Text',
			description: 'Text of the privacy policy link. Defaults to "Privacy Policy".',
			required: false,
		}),
		followUpActionUrl: Property.ShortText({
			displayName: 'Follow-up URL',
			description:
				'Website the "thank you" screen links to after submission. Required by Facebook.',
			required: true,
		}),
		locale: Property.ShortText({
			displayName: 'Locale',
			description: 'Form language, e.g. "EN_US" or "DE_DE". Defaults to the Page locale.',
			required: false,
		}),
	},
	async run(context) {
		const {
			pageId,
			name,
			questions,
			privacyPolicyUrl,
			privacyPolicyLinkText,
			followUpActionUrl,
			locale,
		} = context.propsValue;
		if (!Array.isArray(questions) || questions.length === 0) {
			throw new Error('Questions must be a non-empty JSON array.');
		}
		const pageAccessToken = await facebookLeadsApi.getPageAccessToken({
			pageId,
			accessToken: context.auth.access_token,
		});
		return await facebookLeadsApi.createLeadForm({
			pageId,
			accessToken: pageAccessToken,
			body: {
				name,
				questions,
				privacy_policy: {
					url: privacyPolicyUrl,
					link_text: privacyPolicyLinkText ?? 'Privacy Policy',
				},
				follow_up_action_url: followUpActionUrl,
				...(locale ? { locale } : {}),
			},
		});
	},
});
