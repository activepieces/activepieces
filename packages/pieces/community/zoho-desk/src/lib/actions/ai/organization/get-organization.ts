import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskGetOrganizationOutputSchema } from '../../../output-schemas';

export const zohoDeskGetOrganizationAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_organization',
	outputSchema: zohoDeskGetOrganizationOutputSchema,
	displayName: 'Get Organization',
	description: "Gets an organization's details.",
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets one organization's details: company name, portal URL, edition, time zone and currency.",
		idempotent: true,
	},
	props: {
		organizationId: Property.ShortText({
			displayName: 'Organization ID',
			description: 'Organization ID (from List Organizations).',
			required: true,
		}),
		includeCustomDomain: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Include Custom Domain',
			description: "Yes adds the help center's custom domain.",
		}),
	},
	async run(context) {
		const { organizationId, includeCustomDomain } = context.propsValue;
		return await zohoDeskApi.getOrganization({
			auth: context.auth,
			organizationId,
			includeCustomDomain,
		});
	},
});
