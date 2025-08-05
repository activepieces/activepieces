import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest, BiginContact } from '../common';

export const updateContact = createAction({
  auth: biginZohoAuth,
  name: 'bigin_update_contact',
  displayName: 'Update Contact',
  description: 'Updates an existing contact in Bigin',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to update',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    mobile: Property.ShortText({
      displayName: 'Mobile',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    accountName: Property.ShortText({
      displayName: 'Account Name',
      description: 'Company/Account this contact belongs to',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
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
      website,
      description,
    } = context.propsValue;

    const contactData: Partial<BiginContact> = {};

    // Add only provided fields for partial update
    if (firstName) contactData.First_Name = firstName;
    if (lastName) contactData.Last_Name = lastName;
    if (email) contactData.Email = email;
    if (phone) contactData.Phone = phone;
    if (mobile) contactData.Mobile = mobile;
    if (title) contactData.Title = title;
    if (website) contactData.Website = website;
    if (description) contactData.Description = description;
    if (accountName) {
      contactData.Account_Name = { name: accountName };
    }

    const requestBody = {
      data: [contactData],
    };

    const response = await makeRequest(
      context.auth,
      HttpMethod.PUT,
      `/Contacts/${contactId}`,
      requestBody
    );

    return response;
  },
}); 