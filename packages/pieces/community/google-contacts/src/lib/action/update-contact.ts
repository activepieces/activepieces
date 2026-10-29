import {
  createAction,
  MarkdownVariant,
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
import { googleContactsAuth } from '../auth';
import { updateContactOutputSchema } from '../output-schemas';

export const googleContactsUpdateContactAction = createAction({
  auth: googleContactsAuth,
  name: 'update_contact',
  classification: 'WRITE',
  description: "Change an existing contact's details in Google Contacts.",
  audience: 'human',
  aiMetadata: { description: 'Updates fields (name, email, phone, company, job title) on an existing Google Contacts person identified by its resourceName (people/{id}). Use when an agent needs to modify a known contact; requires both the resourceName and the current etag, and a field mask listing which fields to update — the call is rejected if the contact changed since the etag was fetched. Repeating the same update with the same etag/values is safe and yields the same result.', idempotent: true },
  displayName: 'Update Contact',
  outputSchema: updateContactOutputSchema,
  props: {
    resourceName: Property.ShortText({
      displayName: 'Contact ID',
      description:
        'The resourceName (people/…) from Search Contacts or Add Contact.',
      placeholder: 'people/c1234567890',
      required: true,
    }),
    etag: Property.ShortText({
      displayName: 'Version Tag',
      description:
        'The etag returned with the Contact ID. Fails if the contact changed.',
      required: true,
    }),
    updatePersonFields: Property.StaticMultiSelectDropdown({
      displayName: 'Fields to Update',
      description: 'Only these fields change on the contact.',
      required: true,
      options: {
        options: [
          { label: 'Name', value: 'names' },
          { label: 'Email', value: 'emailAddresses' },
          { label: 'Phone Number', value: 'phoneNumbers' },
          { label: 'Company and Job Title', value: 'organizations' },
        ],
      },
      defaultValue: ['names', 'emailAddresses'],
    }),
    updateNote: Property.MarkDown({
      value:
        "Each field you pick is replaced as a whole, and any part left empty is cleared. Email and Phone Number replace all of the contact's existing ones. Fields you do not pick stay as they are, even if filled in below.",
      variant: MarkdownVariant.WARNING,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      placeholder: 'Jane',
      width: 'half',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      placeholder: 'Doe',
      width: 'half',
      required: false,
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
    { key: 'contact', display: 'section', label: 'Contact to Update', icon: 'user', props: ['resourceName', 'etag'] },
    { key: 'changes', display: 'section', label: 'What Changes', icon: 'sliders', props: ['updatePersonFields', 'updateNote'] },
    { key: 'name', display: 'section', label: 'Name', icon: 'user', props: ['firstName', 'lastName', 'middleName'] },
    { key: 'work', display: 'section', label: 'Work', icon: 'tag', props: ['company', 'jobTitle'] },
    { key: 'contactInfo', display: 'section', label: 'Contact Info', icon: 'inbox', props: ['email', 'phoneNumber'] },
  ],
  async run(context) {
    const contactId = context.propsValue['resourceName']
      .trim()
      .replace(/^people\//, '');
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
      url: `${googleContactsCommon.baseUrl}/${contactId}:updateContact`,
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
