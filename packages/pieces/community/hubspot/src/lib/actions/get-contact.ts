import { createAction, Property } from '@activepieces/pieces-framework';

import { Client } from '@hubspot/api-client';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { crmObjectOutputSchema } from '../output-schemas';

export const getContactAction = createAction({
	auth: hubspotAuth,
	name: 'get-contact',
	classification: 'READ',
	displayName: 'Get Contact',
	description: 'Gets a contact by its ID.',
	audience: 'both',
	aiMetadata: { description: 'Fetches a single contact by its HubSpot contact ID, returning default and any requested additional properties. Use when you already have the contact ID; to look one up by email instead, use a search-based action. Read-only and idempotent.', idempotent: true },
	outputSchema: crmObjectOutputSchema,
	props: {
		contactId: Property.ShortText({
			displayName: 'Contact ID',
			description: 'Map it from an earlier step like Find Contact.',
			required: true,
		}),
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `Returned by default: firstname, lastname, email, company, website, mobilephone, phone, fax, address, city, state, zip, salutation, country, jobtitle, hs_createdate, hs_email_domain, hs_object_id, lastmodifieddate, hs_persona, hs_language, lifecyclestage, createdate, numemployees, annualrevenue, industry.

Pick more under **Advanced**.`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.CONTACT,
			displayName: 'Additional Properties to Retrieve',
			required: false,
			advanced: true,
		}),
	},
	async run(context) {
		const { contactId } = context.propsValue;
		const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve??[];


		const defaultContactProperties = getDefaultPropertiesForObject(OBJECT_TYPE.CONTACT);

		const client = new Client({ accessToken: getHubspotAccessToken(context.auth) });

		const contactDetails = await client.crm.contacts.basicApi.getById(contactId, [
			...defaultContactProperties,
			...additionalPropertiesToRetrieve,
		]);

		return contactDetails;
	},
});
