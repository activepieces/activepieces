import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pandadocAuth } from '../../index';

export const createOrUpdateContact = createAction({
  auth: pandadocAuth,
  name: 'createOrUpdateContact',
  displayName: 'Create or Update Contact',
  description: 'Create a new contact or update an existing one in PandaDoc',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the contact',
      required: true,
    }),
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
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number of the contact',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Company name of the contact',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      description: 'Job title of the contact',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'State/Province of the contact',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country of the contact',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City of the contact',
      required: false,
    }),
    street: Property.ShortText({
      displayName: 'Street',
      description: 'Street address of the contact',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'ZIP/Postal Code',
      description: 'ZIP or postal code of the contact',
      required: false,
    }),
  },
  async run(context) {
    const {
      email,
      firstName,
      lastName,
      phone,
      company,
      jobTitle,
      state,
      country,
      city,
      street,
      zip,
    } = context.propsValue;

    // First, try to find the contact by email
    const searchResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pandadoc.com/public/v1/contacts',
      headers: {
        'Authorization': `API-Key ${context.auth.apiKey}`,
        'Content-Type': 'application/json',
      },
      queryParams: {
        email,
      },
    });

    const existingContact = searchResponse.body.results?.find(
      (contact: any) => contact.email === email
    );

    const contactData = {
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      company,
      job_title: jobTitle,
      state,
      country,
      city,
      street,
      zip,
    };

    // If contact exists, update it; otherwise create new
    const response = await httpClient.sendRequest({
      method: existingContact ? HttpMethod.PATCH : HttpMethod.POST,
      url: existingContact
        ? `https://api.pandadoc.com/public/v1/contacts/${existingContact.id}`
        : 'https://api.pandadoc.com/public/v1/contacts',
      headers: {
        'Authorization': `API-Key ${context.auth.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: contactData,
    });

    return response.body;
  },
});
