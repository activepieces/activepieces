import { createAction, Property } from '@activepieces/pieces-framework';
import { openphoneAuth } from '../common/auth';
import { OpenPhoneAPI, Contact } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateContactAction = createAction({
  auth: openphoneAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Update an existing contact in OpenPhone',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'ID of the contact to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Contact Name',
      description: 'Full name of the contact',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Primary phone number',
      required: false,
    }),
    phoneNumberType: Property.StaticDropdown({
      displayName: 'Phone Number Type',
      description: 'Type of phone number',
      required: false,
      options: {
        options: [
          { label: 'Mobile', value: 'mobile' },
          { label: 'Home', value: 'home' },
          { label: 'Work', value: 'work' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Primary email address',
      required: false,
    }),
    emailType: Property.StaticDropdown({
      displayName: 'Email Type',
      description: 'Type of email address',
      required: false,
      options: {
        options: [
          { label: 'Home', value: 'home' },
          { label: 'Work', value: 'work' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
  },
  async run(context) {
    const { contactId, name, phoneNumber, phoneNumberType, email, emailType } = context.propsValue;
    const api = new OpenPhoneAPI(context.auth);

    const updateData: any = {};

    if (name) {
      updateData.name = name;
    }

    if (phoneNumber) {
      updateData.phoneNumbers = [
        {
          phoneNumber,
          type: phoneNumberType || 'mobile'
        }
      ];
    }

    if (email) {
      updateData.emails = [
        {
          email,
          type: emailType || 'work'
        }
      ];
    }

    const result = await api.makeRequest<Contact>(HttpMethod.PUT, `/contacts/${contactId}`, updateData);
    
    return {
      success: true,
      contact: result
    };
  },
});
