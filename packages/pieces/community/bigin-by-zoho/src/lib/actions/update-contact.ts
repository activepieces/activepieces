import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../common/auth';
import { BiginClient } from '../common/client';
import { COMMON_FIELDS, cleanupData } from '../common/utils';

export const updateContactAction = createAction({
  auth: biginAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Update an existing contact in Bigin CRM',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'ID of the contact to update',
      required: true
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the contact',
      required: false
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the contact',
      required: false
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the contact',
      required: false
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number of the contact',
      required: false
    }),
    mobile: Property.ShortText({
      displayName: 'Mobile',
      description: 'Mobile number of the contact',
      required: false
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Job title of the contact',
      required: false
    }),
    accountName: Property.ShortText({
      displayName: 'Company Name',
      description: 'Name of the company the contact works for',
      required: false
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description or notes about the contact',
      required: false
    }),
    mailingStreet: Property.ShortText({
      displayName: 'Mailing Street',
      description: 'Street address',
      required: false
    }),
    mailingCity: Property.ShortText({
      displayName: 'Mailing City',
      description: 'City',
      required: false
    }),
    mailingState: Property.ShortText({
      displayName: 'Mailing State',
      description: 'State or province',
      required: false
    }),
    mailingCountry: Property.ShortText({
      displayName: 'Mailing Country',
      description: 'Country',
      required: false
    }),
    mailingZip: Property.ShortText({
      displayName: 'Mailing ZIP',
      description: 'ZIP or postal code',
      required: false
    }),
    homePhone: Property.ShortText({
      displayName: 'Home Phone',
      description: 'Home phone number',
      required: false
    })
  },
  async run(context) {
    const {
      contactId,
      firstName,
      lastName,
      email,
      phone,
      mobile,
      title,
      accountName,
      description,
      mailingStreet,
      mailingCity,
      mailingState,
      mailingCountry,
      mailingZip,
      homePhone
    } = context.propsValue;

    const client = new BiginClient(context.auth);

    try {
      // Build contact data (only include fields that are provided)
      const contactData = cleanupData({
        [COMMON_FIELDS.CONTACT.FIRST_NAME]: firstName,
        [COMMON_FIELDS.CONTACT.LAST_NAME]: lastName,
        [COMMON_FIELDS.CONTACT.EMAIL]: email,
        [COMMON_FIELDS.CONTACT.PHONE]: phone,
        [COMMON_FIELDS.CONTACT.MOBILE]: mobile,
        [COMMON_FIELDS.CONTACT.TITLE]: title,
        [COMMON_FIELDS.CONTACT.ACCOUNT_NAME]: accountName,
        [COMMON_FIELDS.CONTACT.DESCRIPTION]: description,
        Mailing_Street: mailingStreet,
        Mailing_City: mailingCity,
        Mailing_State: mailingState,
        Mailing_Country: mailingCountry,
        Mailing_Zip: mailingZip,
        Home_Phone: homePhone
      });

      // Update contact
      const response = await client.updateContact(contactId, contactData);

      return {
        success: true,
        data: response.data?.[0] || response,
        message: 'Contact updated successfully'
      };
    } catch (error: any) {
      throw new Error(`Failed to update contact: ${error.message}`);
    }
  }
});
