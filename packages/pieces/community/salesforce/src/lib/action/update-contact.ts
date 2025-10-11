import { Property, createAction } from '@activepieces/pieces-framework';
import { callSalesforceApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const updateContact = createAction({
  auth: salesforceAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Updates an existing Contact in Salesforce',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'ID of the contact to update',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the contact',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the contact',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the contact',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number of the contact',
      required: false,
    }),
    accountId: Property.ShortText({
      displayName: 'Account ID',
      description: 'ID of the Account this contact belongs to',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Job title of the contact',
      required: false,
    }),
    department: Property.ShortText({
      displayName: 'Department',
      description: 'Department of the contact',
      required: false,
    }),
    mobilePhone: Property.ShortText({
      displayName: 'Mobile Phone',
      description: 'Mobile phone number',
      required: false,
    }),
    mailingStreet: Property.ShortText({
      displayName: 'Mailing Street',
      description: 'Street address',
      required: false,
    }),
    mailingCity: Property.ShortText({
      displayName: 'Mailing City',
      description: 'City',
      required: false,
    }),
    mailingState: Property.ShortText({
      displayName: 'Mailing State',
      description: 'State/Province',
      required: false,
    }),
    mailingPostalCode: Property.ShortText({
      displayName: 'Mailing Postal Code',
      description: 'Postal/ZIP code',
      required: false,
    }),
    mailingCountry: Property.ShortText({
      displayName: 'Mailing Country',
      description: 'Country',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the contact',
      required: false,
    }),
    additionalFields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Additional custom fields as JSON object',
      required: false,
      defaultValue: {},
    }),
  },
  async run(context) {
    const {
      contactId,
      lastName,
      firstName,
      email,
      phone,
      accountId,
      title,
      department,
      mobilePhone,
      mailingStreet,
      mailingCity,
      mailingState,
      mailingPostalCode,
      mailingCountry,
      description,
      additionalFields,
    } = context.propsValue;

    const contactData: Record<string, unknown> = {
      ...(lastName && { LastName: lastName }),
      ...(firstName && { FirstName: firstName }),
      ...(email && { Email: email }),
      ...(phone && { Phone: phone }),
      ...(accountId && { AccountId: accountId }),
      ...(title && { Title: title }),
      ...(department && { Department: department }),
      ...(mobilePhone && { MobilePhone: mobilePhone }),
      ...(mailingStreet && { MailingStreet: mailingStreet }),
      ...(mailingCity && { MailingCity: mailingCity }),
      ...(mailingState && { MailingState: mailingState }),
      ...(mailingPostalCode && { MailingPostalCode: mailingPostalCode }),
      ...(mailingCountry && { MailingCountry: mailingCountry }),
      ...(description && { Description: description }),
      ...additionalFields,
    };

    const response = await callSalesforceApi(
      HttpMethod.PATCH,
      context.auth,
      `/services/data/v56.0/sobjects/Contact/${contactId}`,
      contactData
    );
    return response.body;
  },
});

