import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { googleContactsCommon } from '../common';
import { googleContactsAuth } from '../auth';
import { addContactOutputSchema } from '../output-schemas';

export const googleContactsAddContactAction = createAction({
  auth: googleContactsAuth,
  name: 'add_contact',
  classification: 'WRITE',
  description: 'Add a new contact to your Google Contacts.',
  audience: 'human',
  aiMetadata: { description: 'Creates a new person in the authenticated Google Contacts account from name, email, phone, company, and job title fields. Use when an agent needs to add someone to address book contacts; first and last name are required. Not idempotent — each call creates a separate contact even with identical input, so guard against duplicates.', idempotent: false },
  displayName: 'Add Contact',
  outputSchema: addContactOutputSchema,
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      placeholder: 'Jane',
      width: 'half',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      placeholder: 'Doe',
      width: 'half',
      required: true,
    }),
    middleName: Property.ShortText({
      displayName: 'Middle Name',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      placeholder: 'Acme Inc.',
      width: 'half',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      placeholder: 'Sales Manager',
      width: 'half',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      placeholder: 'jane@example.com',
      width: 'half',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      placeholder: '+1 650 555 0100',
      width: 'half',
      required: false,
    }),
  },
  propertyGroups: [
    { key: 'name', display: 'section', label: 'Name', icon: 'user', props: ['firstName', 'lastName', 'middleName'] },
    { key: 'work', display: 'section', label: 'Work', icon: 'tag', props: ['company', 'jobTitle'] },
    { key: 'contactInfo', display: 'section', label: 'Contact Info', icon: 'inbox', props: ['email', 'phoneNumber'] },
  ],
  async run(context) {
    let requestBody = {
      names: [
        {
          givenName: context.propsValue['firstName'],
          middleName: context.propsValue['middleName'],
          familyName: context.propsValue['lastName'],
        },
      ],
    };
    const contact: Record<string, unknown> = {};
    if (context.propsValue['email']) {
      contact['emailAddresses'] = [{ value: context.propsValue['email'] }];
    }

    if (context.propsValue['phoneNumber']) {
      contact['phoneNumbers'] = [{ value: context.propsValue['phoneNumber'] }];
    }

    if (context.propsValue['company'] || context.propsValue['jobTitle']) {
      contact['organizations'] = [
        {
          name: context.propsValue['company'] || undefined,
          title: context.propsValue['jobTitle'] || undefined,
        },
      ];
    }
    requestBody = { ...requestBody, ...contact };
    const request: HttpRequest<Record<string, unknown>> = {
      method: HttpMethod.POST,
      url: `${googleContactsCommon.baseUrl}:createContact`,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    };
    return (await httpClient.sendRequest(request)).body;
  },
});
