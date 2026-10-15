import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { emeliaAuth } from '../auth';
import { emeliaApi } from '../common/api';
import { emeliaClient } from '../common/client';
import { emeliaProps } from '../common/props';

export const removeContactFromCampaignAction = createAction({
	auth: emeliaAuth,
	name: 'remove_contact_from_campaign',
	classification: 'DESTRUCTIVE',
	displayName: 'Remove Contact from Campaign',
	description: 'Removes a contact from a campaign so it receives no further steps.',
	audience: 'both',
	aiMetadata: {
		description:
			'Remove one contact from an Emelia multichannel campaign, found by its exact email or LinkedIn profile URL, so no further steps are sent. Use Add to Blacklist instead to stop contacting someone across every campaign. Fails if the contact is not in the campaign, so a retry after success errors.',
		idempotent: false,
	},
	props: {
		campaign: emeliaProps.campaignDropdown({ description: 'The campaign to remove the contact from.' }),
		contact: Property.ShortText({
			displayName: 'Contact Email or LinkedIn URL',
			description: 'The email address or LinkedIn profile URL of the contact, exactly as it was added to the campaign.',
			required: true,
			placeholder: 'jane.doe@acme.com',
		}),
	},
	async run(context) {
		const { campaign } = context.propsValue;
		const identifier = context.propsValue.contact.trim();
		const apiKey = context.auth.secret_text;
		const found = await emeliaApi.findCampaignContact({ apiKey, campaignId: campaign, identifier });
		if (!found) {
			throw new Error(`No contact matching "${identifier}" was found in this campaign.`);
		}
		await emeliaClient.request({
			apiKey,
			method: HttpMethod.DELETE,
			path: '/advanced/campaign/contacts',
			body: { id: campaign, contactId: found._id },
		});
		return {
			success: true,
			campaign_id: campaign,
			contact_id: found._id,
			email: found.email ?? null,
			linkedin_url: found.linkedinUrlProfile ?? null,
		};
	},
});
