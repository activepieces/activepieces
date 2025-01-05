import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
    getDefaultPropertiesForObject,
    standardObjectDynamicProperties,
    standardObjectPropertiesDropdown,

} from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { MarkdownVariant } from '@activepieces/shared';
import { Client } from '@hubspot/api-client';

export const updateContactAction = createAction({
    auth: hubspotAuth,
    name: 'update-contact',
    displayName: 'Update Contact',
    description: 'Updates a contact in Hubspot.',
    props: {
        contactId: Property.ShortText({
            displayName: 'Contact ID',
            description: 'The ID of the contact to update.',
            required: true,
        }),
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
        const {contactId} = context.propsValue;
        const objectProperties = context.propsValue.objectProperties ?? {};
        const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve ?? [];

        const contactProperties: Record<string, string> = {};

        // Add additional properties to the contactProperties object
        Object.entries(objectProperties).forEach(([key, value]) => {
            // Format values if they are arrays
            contactProperties[key] = Array.isArray(value) ? value.join(';') : value;
        });

        const client = new Client({ accessToken: context.auth.access_token });

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
