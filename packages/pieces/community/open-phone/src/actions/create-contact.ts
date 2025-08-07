import { createAction, Property } from '@activepieces/pieces-framework';
import { openphoneAuth } from '../common/auth';
import { OpenPhoneAPI, Contact } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createContactAction = createAction({
  auth: openphoneAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Create a new contact in OpenPhone',
  props: {
    name: Property.ShortText({
      displayName: 'Contact Name',
      description: 'Full name of the contact',
      required: true,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Primary phone number',
      required: true,
    }),
    phoneNumberType: Property.StaticDropdown({
      displayName: 'Phone Number Type',
      description: 'Type of phone number',
      required: false,
      defaultValue: 'mobile',
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
      description: 'Primary email address (optional)',
      required: false,
    }),
    emailType: Property.StaticDropdown({
      displayName: 'Email Type',
      description: 'Type of email address',
      required: false,
      defaultValue: 'work',
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
    const { name, phoneNumber, phoneNumberType, email, emailType } = context.propsValue;
    const api = new OpenPhoneAPI(context.auth);

    const contactData: any = {
      name,
      phoneNumbers: [
        {
          phoneNumber,
          type: phoneNumberType || 'mobile'
        }
      ]
    };

    if (email) {
      contactData.emails = [
        {
          email,
          type: emailType || 'work'
        }
      ];
    }

    const result = await api.makeRequest<Contact>(HttpMethod.POST, '/contacts', contactData);
    
    return {
      success: true,
      contact: result
    };
  },
});
