import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest, contactIdDropdown, userIdDropdown, companyIdDropdown, tagDropdown } from '../common';

export const updateContact = createAction({
  auth: biginZohoAuth,
  name: 'updateContact',
  displayName: 'Update Contact',
  description: 'Update an existing contact record in Bigin',
  props: {
    recordId: contactIdDropdown,
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the contact',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the contact',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Job title of the contact',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the contact',
      required: false,
    }),
    mobile: Property.ShortText({
      displayName: 'Mobile',
      description: 'Mobile phone number',
      required: false,
    }),
    emailOptOut: Property.Checkbox({
      displayName: 'Email Opt Out',
      description: 'Whether the contact has opted out of emails',
      required: false,
    }),
    owner: userIdDropdown,
    accountName: companyIdDropdown,
    tag: tagDropdown('Contacts'),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Description of the contact',
      required: false,
    }),
    mailingStreet: Property.ShortText({
      displayName: 'Mailing Street',
      description: 'Street address for mailing',
      required: false,
    }),
    mailingCity: Property.ShortText({
      displayName: 'Mailing City',
      description: 'City for mailing address',
      required: false,
    }),
    mailingState: Property.ShortText({
      displayName: 'Mailing State',
      description: 'State for mailing address',
      required: false,
    }),
    mailingCountry: Property.ShortText({
      displayName: 'Mailing Country',
      description: 'Country for mailing address',
      required: false,
    }),
    mailingZip: Property.ShortText({
      displayName: 'Mailing Zip',
      description: 'ZIP/postal code for mailing address',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      id: context.propsValue.recordId,
    };

    if (context.propsValue.owner) body['Owner'] = { id: context.propsValue.owner };
    if (context.propsValue.accountName) body['Account_Name'] = { id: context.propsValue.accountName };
    if (context.propsValue.firstName) body['First_Name'] = context.propsValue.firstName;
    if (context.propsValue.lastName) body['Last_Name'] = context.propsValue.lastName;
    if (context.propsValue.title) body['Title'] = context.propsValue.title;
    if (context.propsValue.email) body['Email'] = context.propsValue.email;
    if (context.propsValue.mobile) body['Mobile'] = context.propsValue.mobile;
    if (context.propsValue.emailOptOut !== undefined) body['Email_Opt_Out'] = context.propsValue.emailOptOut;
    if (context.propsValue.tag) body['Tag'] = context.propsValue.tag;
    if (context.propsValue.description) body['Description'] = context.propsValue.description;
    if (context.propsValue.mailingStreet) body['Mailing_Street'] = context.propsValue.mailingStreet;
    if (context.propsValue.mailingCity) body['Mailing_City'] = context.propsValue.mailingCity;
    if (context.propsValue.mailingState) body['Mailing_State'] = context.propsValue.mailingState;
    if (context.propsValue.mailingCountry) body['Mailing_Country'] = context.propsValue.mailingCountry;
    if (context.propsValue.mailingZip) body['Mailing_Zip'] = context.propsValue.mailingZip;

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.PUT,
      '/Contacts',
      context.auth.props?.['location'] || 'com',
      { data: [body] }
    );

    return response.data[0];
  },
}); 