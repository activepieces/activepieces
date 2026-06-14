import { hubspotAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';

import { MarkdownVariant } from '@activepieces/shared';
import { Client } from '@hubspot/api-client';
import { getDefaultPropertiesForObject, standardObjectDynamicProperties, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';

export const createContactAction = createAction({
	auth: hubspotAuth,
	name: 'create-contact',
	displayName: 'Create Contact',
	description: 'Creates a contact in Hubspot.',
	audience: 'both',
	aiMetadata: { description: 'Creates a new contact record in HubSpot from the supplied property values, then returns the created contact. Use when you specifically need a new contact; to avoid duplicates when a contact may already exist, prefer Create or Update Contact, which upserts on email. Not idempotent: each call creates a separate contact.', idempotent: false },
	props: {
		objectProperties: standardObjectDynamicProperties(OBJECT_TYPE.CONTACT, []),
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
		const objectProperties = context.propsValue.objectProperties ?? {};
		const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve ?? [];

		const contactProperties: Record<string, string> = {};

		// Add additional properties to the contactProperties object
		Object.entries(objectProperties).forEach(([key, value]) => {
			// Format values if they are arrays
			contactProperties[key] = Array.isArray(value) ? value.join(';') : value;
		});

		const client = new Client({ accessToken: context.auth.access_token });

		const createdContact = await client.crm.contacts.basicApi.create({
			properties: contactProperties,
		});
		// Retrieve default properties for the contact and merge with additional properties to retrieve
		const defaultContactProperties = getDefaultPropertiesForObject(OBJECT_TYPE.CONTACT);

		const contactDetails = await client.crm.contacts.basicApi.getById(createdContact.id, [
			...defaultContactProperties,
			...additionalPropertiesToRetrieve,
		]);

		return contactDetails;
	},
});
