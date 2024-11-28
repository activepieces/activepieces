import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
  QueryParams,
} from '@activepieces/pieces-common';
import { googleContactsCommon } from '../common';
import { googleContactsAuth } from '../../';

export const googleContactsUpdateContactAction = createAction({
  auth: googleContactsAuth,
  name: 'update_contact',
  description: 'Update a contact in Google Contacts account.',
  displayName: 'Update Contact',
  props: {
    resourceName: Property.ShortText({
      displayName: 'Resource Name',
      description:
        'The resource name for the person, assigned by the server. An ASCII string in the form of people/{person_id}.',
      required: true,
    }),
    etag: Property.ShortText({
      displayName: 'Etag',
      description:
        "The `etag` ensures contact updates only apply if the contact hasn't changed since last retrieved.",
      required: true,
    }),
    updatePersonFields: Property.StaticMultiSelectDropdown({
      displayName: 'Update Field Mask',
      description:
        'A field mask to restrict which fields on the person are updated.',
      required: true,
      options: {
        options: [
          { label: 'Names', value: 'names' },
          { label: 'Email', value: 'emailAddresses' },
          { label: 'Phone Number', value: 'phoneNumbers' },
          { label: 'Job Title / Company', value: 'organizations' },
        ],
      },
      defaultValue: ['names', 'emailAddresses'],
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the contact',
      required: false,
    }),
    middleName: Property.ShortText({
      displayName: 'Middle Name',
      description: 'The middle name of the contact',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the contact',
      required: false,
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
    const resourceName = context.propsValue['resourceName'].substring(6);
    const requestBody: Record<string, unknown> = {
      etag: context.propsValue['etag'],
    };
    const qs: QueryParams = {
      updatePersonFields: context.propsValue['updatePersonFields'].join(','),
    };
    if (
      context.propsValue['firstName'] ||
      context.propsValue['middleName'] ||
      context.propsValue['lastName']
    ) {
      requestBody['names'] = [
        {
          givenName: context.propsValue['firstName'] || undefined,
          middleName: context.propsValue['middleName'] || undefined,
          familyName: context.propsValue['lastName'] || undefined,
        },
      ];
    }
    if (context.propsValue['email']) {
      requestBody['emailAddresses'] = [{ value: context.propsValue['email'] }];
    }
    if (context.propsValue['phoneNumber']) {
      requestBody['phoneNumbers'] = [
        { value: context.propsValue['phoneNumber'] },
      ];
    }
    if (context.propsValue['company'] || context.propsValue['jobTitle']) {
      requestBody['organizations'] = [
        {
          name: context.propsValue['company'] || undefined,
          title: context.propsValue['jobTitle'] || undefined,
        },
      ];
    }
    const request: HttpRequest<Record<string, unknown>> = {
      method: HttpMethod.PATCH,
      url: `${googleContactsCommon.baseUrl}${resourceName}:updateContact`,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      queryParams: qs,
    };
    return (await httpClient.sendRequest(request)).body;
  },
});
