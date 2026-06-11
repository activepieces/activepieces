import { createAction, Property } from '@activepieces/pieces-framework';

import { Client } from '@hubspot/api-client';
import { MarkdownVariant } from '@activepieces/shared';
import { hubspotAuth } from '../auth';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';

export const getContactAction = createAction({
	auth: hubspotAuth,
	name: 'get-contact',
	displayName: 'Get Contact',
	description: 'Gets a contact.',
	audience: 'both',
	aiMetadata: { description: 'Fetches a single contact by its HubSpot contact ID, returning default and any requested additional properties. Use when you already have the contact ID; to look one up by email instead, use a search-based action. Read-only and idempotent.', idempotent: true },
	props: {
		contactId: Property.ShortText({
			displayName: 'Contact ID',
			description: 'The ID of the contact to get.',
			required: true,
		}),
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `### Properties to retrieve:
							
					firstname, lastname, email, company, website, mobilephone, phone, fax, address, city, state, zip, salutation, country, jobtitle, hs_createdate, hs_email_domain, hs_object_id, lastmodifieddate, hs_persona, hs_language, lifecyclestage, createdate, numemployees, annualrevenue, industry			
									
					**Specify here a list of additional properties to retrieve**`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.CONTACT,
			displayName: 'Additional properties to retrieve',
			required: false,
		}),
	},
	async run(context) {
		const { contactId } = context.propsValue;
		const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve??[];


		const defaultContactProperties = getDefaultPropertiesForObject(OBJECT_TYPE.CONTACT);

		const client = new Client({ accessToken: context.auth.access_token });

		const contactDetails = await client.crm.contacts.basicApi.getById(contactId, [
			...defaultContactProperties,
			...additionalPropertiesToRetrieve,
		]);

		return contactDetails;
	},
});
