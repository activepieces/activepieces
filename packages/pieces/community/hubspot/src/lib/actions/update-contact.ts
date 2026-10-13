import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
    getDefaultPropertiesForObject,
    standardObjectDynamicProperties,
    standardObjectPropertiesDropdown,

} from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';
import { crmObjectOutputSchema } from '../output-schemas';

export const updateContactAction = createAction({
    auth: hubspotAuth,
    name: 'update-contact',
    classification: 'WRITE',
    displayName: 'Update Contact',
    description: 'Updates a contact in HubSpot.',
    audience: 'both',
    aiMetadata: { description: 'Update properties on an existing HubSpot contact identified by Contact ID; only the supplied fields are changed. Applying the same values repeatedly is idempotent. Use a find action to resolve the contact ID first, or a create action to add a new contact.', idempotent: true },
    outputSchema: crmObjectOutputSchema,
    props: {
        contactId: Property.ShortText({
            displayName: 'Contact ID',
            description: 'Map it from an earlier step like Find Contact.',
            required: true,
        }),
        objectProperties: standardObjectDynamicProperties(OBJECT_TYPE.CONTACT, []),
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
        const {contactId} = context.propsValue;
        const objectProperties = context.propsValue.objectProperties ?? {};
        const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve ?? [];

        const contactProperties: Record<string, string> = {};

        // Add additional properties to the contactProperties object
        Object.entries(objectProperties).forEach(([key, value]) => {
            if ((Array.isArray(value) && value.length === 0)) {
                return;  
            }
            // Format values if they are arrays
            contactProperties[key] = Array.isArray(value) ? value.join(';') : value;
        });

        const client = new Client({ accessToken: getHubspotAccessToken(context.auth) });

        const updatedContact = await client.crm.contacts.basicApi.update(contactId, {
            properties: contactProperties,
        });
        // Retrieve default properties for the contact and merge with additional properties to retrieve
        const defaultContactProperties = getDefaultPropertiesForObject(OBJECT_TYPE.CONTACT);

        const contactDetails = await client.crm.contacts.basicApi.getById(updatedContact.id, [
            ...defaultContactProperties,
            ...additionalPropertiesToRetrieve,
        ]);

        return contactDetails;
    },
});
