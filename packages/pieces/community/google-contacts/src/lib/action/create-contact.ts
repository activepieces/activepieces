import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { googleContactsCommon } from '../common';
import { googleContactsAuth } from '../../';

export const googleContactsAddContactAction = createAction({
  auth: googleContactsAuth,
  name: 'add_contact',
  description: 'Add a contact to a Google Contacts account',
  displayName: 'Add Contact',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the contact',
      required: true,
    }),
    middleName: Property.ShortText({
      displayName: 'Middle Name',
      description: 'The middle name of the contact',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the contact',
      required: true,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      description: 'The job title of the contact',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The company of the contact',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number of the contact',
      required: false,
    }),
  },
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
