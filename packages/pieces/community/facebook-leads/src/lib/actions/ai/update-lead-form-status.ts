import { createAction, Property } from '@activepieces/pieces-framework';

import { facebookLeadsAuth } from '../../auth';
import { facebookLeadsAiProps } from '../../common/ai-props';
import { facebookLeadsApi } from '../../common/api';
import { facebookLeadsUpdateLeadFormStatusOutputSchema } from '../../output-schemas';

import type { FacebookLeadsFormStatus } from '../../common/types';

export const updateLeadFormStatusAction = createAction({
	auth: facebookLeadsAuth,
	name: 'facebook_leads_update_lead_form_status',
	outputSchema: facebookLeadsUpdateLeadFormStatusOutputSchema,
	displayName: 'Update Lead Form Status',
	description: 'Archives or reactivates a lead form.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Sets a lead form to ARCHIVED (stops it from being used in new ads) or back to ACTIVE. Facebook has no way to delete or edit a form; archiving is the reversible way to retire one. Its existing leads stay readable.',
		idempotent: true,
	},
	props: {
		pageId: facebookLeadsAiProps.pageId({
			required: true,
			description: 'ID of the Facebook Page that owns the form. Use List Pages to find it.',
		}),
		formId: facebookLeadsAiProps.formId({ required: true }),
		status: Property.StaticDropdown<FacebookLeadsFormStatus, true>({
			displayName: 'Status',
			description: 'ARCHIVED to retire the form, ACTIVE to reactivate it.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Archived', value: 'ARCHIVED' },
					{ label: 'Active', value: 'ACTIVE' },
				],
			},
		}),
	},
	async run(context) {
		const { pageId, formId, status } = context.propsValue;
		const pageAccessToken = await facebookLeadsApi.getPageAccessToken({
			pageId,
			accessToken: context.auth.access_token,
		});
		const response = await facebookLeadsApi.updateLeadFormStatus({
			formId,
			accessToken: pageAccessToken,
			status,
		});
		return { form_id: formId, status, success: response.success };
	},
});
