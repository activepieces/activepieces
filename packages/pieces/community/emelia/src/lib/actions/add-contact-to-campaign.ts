import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { emeliaAuth } from '../auth';
import { emeliaClient } from '../common/client';
import { emeliaContactUtils } from '../common/contact-utils';
import { emeliaProps } from '../common/props';

export const addContactToCampaignAction = createAction({
	auth: emeliaAuth,
	name: 'add_contact_to_campaign',
	classification: 'WRITE',
	displayName: 'Add Contact to Campaign',
	description: 'Adds a contact to a campaign. If the campaign is running, the contact enters the sequence right away.',
	audience: 'both',
	aiMetadata: {
		description:
			'Add one contact (email and/or LinkedIn profile URL) to an Emelia multichannel campaign; a running campaign schedules the contact immediately and a finished one restarts. Use Add Contact to List instead to feed every campaign that uses a list or to update an existing contact. A contact already in the campaign is rejected, so retries fail rather than duplicate.',
		idempotent: false,
	},
	props: {
		campaign: emeliaProps.campaignDropdown({ description: 'The campaign to add the contact to.' }),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Required for email steps. Provide an email, a LinkedIn profile URL, or both.',
			required: false,
			placeholder: 'jane.doe@acme.com',
		}),
		linkedinUrl: Property.ShortText({
			displayName: 'LinkedIn Profile URL',
			description: 'Required for LinkedIn steps, for example `https://www.linkedin.com/in/janedoe`. Sales Navigator lead URLs are converted when possible.',
			required: false,
			placeholder: 'https://www.linkedin.com/in/janedoe',
		}),
		firstName: Property.ShortText({ displayName: 'First Name', required: false }),
		lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
		phone: Property.ShortText({ displayName: 'Phone', required: false, placeholder: '+33612345678' }),
		customFields: Property.Object({
			displayName: 'Custom Fields',
			description:
				'Extra values to personalize your messages, for example `companyName` = `Acme`. Each key becomes a variable you can use as `{{companyName}}` in the campaign.',
			required: false,
		}),
	},
	async run(context) {
		const { campaign, email, linkedinUrl, firstName, lastName, phone, customFields } = context.propsValue;
		const trimmedEmail = email?.trim();
		const trimmedLinkedin = linkedinUrl?.trim();
		if (!trimmedEmail && !trimmedLinkedin) {
			throw new Error('Provide at least an Email or a LinkedIn Profile URL for the contact.');
		}
		const contact = {
			...emeliaContactUtils.stringifyValues({ values: customFields ?? {} }),
			...emeliaContactUtils.nonEmpty({
				values: {
					email: trimmedEmail,
					linkedinUrlProfile: trimmedLinkedin,
					firstName,
					lastName,
					phone,
				},
			}),
		};
		const response = await emeliaClient.request<{ contactId?: string }>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			path: '/advanced/campaign/contacts',
			body: { id: campaign, contact },
		});
		return {
			success: true,
			contact_id: response.contactId ?? null,
			campaign_id: campaign,
			email: trimmedEmail ?? null,
			linkedin_url: trimmedLinkedin ?? null,
		};
	},
});

