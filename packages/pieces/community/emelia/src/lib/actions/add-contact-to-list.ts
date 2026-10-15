import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { emeliaAuth } from '../auth';
import { emeliaClient } from '../common/client';
import { emeliaContactUtils } from '../common/contact-utils';
import { emeliaProps } from '../common/props';

export const addContactToListAction = createAction({
	auth: emeliaAuth,
	name: 'add_contact_to_list',
	classification: 'WRITE',
	displayName: 'Add Contact to List',
	description:
		'Adds a contact to a contact list, or updates it if it already exists. Running, paused and draft campaigns that use the list pick it up automatically.',
	audience: 'both',
	aiMetadata: {
		description:
			'Add one contact to an Emelia contact list, or update it when "Update If It Exists" is on; every running, paused or draft campaign using that list receives the contact within seconds. Prefer this over Add Contact to Campaign to feed campaigns through lists or to upsert. Duplicates are detected by email then LinkedIn URL, so retries do not create a second contact.',
		idempotent: true,
	},
	props: {
		list: emeliaProps.listDropdown({ description: 'The list to add the contact to.' }),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Provide an email, a LinkedIn profile URL, or both. Used to detect duplicates.',
			required: false,
			placeholder: 'jane.doe@acme.com',
		}),
		linkedinUrl: Property.ShortText({
			displayName: 'LinkedIn Profile URL',
			required: false,
			placeholder: 'https://www.linkedin.com/in/janedoe',
		}),
		firstName: Property.ShortText({ displayName: 'First Name', required: false }),
		lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
		phone: Property.ShortText({ displayName: 'Phone', required: false, placeholder: '+33612345678' }),
		jobTitle: Property.ShortText({ displayName: 'Job Title', required: false }),
		companyName: Property.ShortText({ displayName: 'Company Name', required: false }),
		websiteUrl: Property.ShortText({ displayName: 'Company Website', required: false, placeholder: 'https://www.acme.com' }),
		customFields: Property.Object({
			displayName: 'Custom Fields',
			description:
				'Extra values, for example `icebreaker` = `Loved your talk`. A key that matches no existing field creates a new custom variable in your Emelia account, which cannot be deleted by API: reuse the exact names of your existing variables.',
			required: false,
		}),
		updateIfExists: Property.Checkbox({
			displayName: 'Update If It Exists',
			description: 'When a contact with the same email or LinkedIn URL is already in the list, update it with these values instead of skipping it.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { list, email, linkedinUrl, firstName, lastName, phone, jobTitle, companyName, websiteUrl, customFields, updateIfExists } =
			context.propsValue;
		if (!email?.trim() && !linkedinUrl?.trim()) {
			throw new Error('Provide at least an Email or a LinkedIn Profile URL for the contact.');
		}
		const contact = {
			...emeliaContactUtils.stringifyValues({ values: customFields ?? {} }),
			...emeliaContactUtils.nonEmpty({
				values: {
					email,
					linkedinUrlProfile: linkedinUrl,
					firstName,
					lastName,
					phone,
					jobTitle,
					companyName,
					websiteUrl,
				},
			}),
		};
		const response = await emeliaClient.request<AddContactResponse>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			path: `/lists/list/${encodeURIComponent(list)}/contacts`,
			queryParams: { updateIfExists: updateIfExists ? 'true' : 'false' },
			body: contact,
		});
		return {
			contact_id: response.leadId ?? null,
			company_id: response.companyId ?? null,
			list_id: list,
			already_existed: response.duplicate ?? false,
			updated: response.updated ?? false,
			created_custom_variables: (response.createdCustomVariables ?? []).map((variable) => variable.displayName).join(', '),
		};
	},
});

type AddContactResponse = {
	leadId?: string;
	companyId?: string | null;
	duplicate?: boolean;
	updated?: boolean;
	createdCustomVariables?: { technicalName: string; displayName: string }[];
};
