import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { googleContactsPerson } from '../common/person';
import { updateContactFieldsOutputSchema } from '../output-schemas';

export const googleContactsUpdateContactFieldsAction = createAction({
  auth: googleContactsAuth,
  name: 'update_contact_fields',
  classification: 'WRITE',
  displayName: 'Update Contact Fields',
  description: 'Update only the supplied fields on an existing contact.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates an existing Google Contacts person, changing only the fields you supply and leaving every other field untouched. It reads the contact first, so it resolves the required etag and field mask itself — you never pass them. Supply the opaque resourceName from List Contacts or Search Contacts. A non-empty email or phone list replaces the stored list for that field wholesale; first/middle/last name and company/job title are merged over the current values. Leaving a list empty does NOT clear it, because the platform cannot distinguish an untouched list from an emptied one: to remove every email address or every phone number, including the last one, set clearEmails or clearPhoneNumbers to true. Setting a clear flag while also supplying a non-empty list for the same field is rejected. Safe to retry: re-applying the same values converges, and a concurrent edit surfaces as a re-read-and-retry error.',
    idempotent: true,
  },
  outputSchema: updateContactFieldsOutputSchema,
  props: {
    resourceName: Property.ShortText({
      displayName: 'Resource Name',
      description:
        'Opaque contact resource name such as people/c12345. Resolve it with List Contacts or Search Contacts.',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    middleName: Property.ShortText({
      displayName: 'Middle Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    nickname: Property.ShortText({
      displayName: 'Nickname',
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Email Addresses',
      description:
        'Array of email address strings, for example ["ada@example.com"]. Replaces every email address stored on the contact. Leaving it empty keeps the stored addresses; it does not clear them, because an untouched list and an emptied one cannot be told apart. Use Clear Email Addresses to remove them.',
      required: false,
    }),
    clearEmails: Property.Checkbox({
      displayName: 'Clear Email Addresses',
      description:
        'Remove every email address from the contact, including the last one. This is the only way to clear them. Cannot be combined with a non-empty Email Addresses list.',
      required: false,
      defaultValue: false,
    }),
    phoneNumbers: Property.Array({
      displayName: 'Phone Numbers',
      description:
        'Array of phone number strings, for example ["+1 555 0100"]. Replaces every phone number stored on the contact. Leaving it empty keeps the stored numbers; it does not clear them, because an untouched list and an emptied one cannot be told apart. Use Clear Phone Numbers to remove them.',
      required: false,
    }),
    clearPhoneNumbers: Property.Checkbox({
      displayName: 'Clear Phone Numbers',
      description:
        'Remove every phone number from the contact, including the last one. This is the only way to clear them. Cannot be combined with a non-empty Phone Numbers list.',
      required: false,
      defaultValue: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      required: false,
    }),
    biography: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
  },
  async run(context) {
    const resourceName = context.propsValue.resourceName.trim();
    const clearEmails = context.propsValue.clearEmails === true;
    const clearPhoneNumbers = context.propsValue.clearPhoneNumbers === true;
    const emails = googleContactsApi.toStringList({
      value: context.propsValue.emails,
      label: 'Email Addresses',
    });
    const phoneNumbers = googleContactsApi.toStringList({
      value: context.propsValue.phoneNumbers,
      label: 'Phone Numbers',
    });
    if (clearEmails && emails.length > 0) {
      throw new Error(
        'Clear Email Addresses removes every email address, so it cannot be combined with an Email Addresses list. Either clear the list or turn the checkbox off.'
      );
    }
    if (clearPhoneNumbers && phoneNumbers.length > 0) {
      throw new Error(
        'Clear Phone Numbers removes every phone number, so it cannot be combined with a Phone Numbers list. Either clear the list or turn the checkbox off.'
      );
    }
    const input = {
      firstName: context.propsValue.firstName,
      middleName: context.propsValue.middleName,
      lastName: context.propsValue.lastName,
      nickname: context.propsValue.nickname,
      emails,
      phoneNumbers,
      clearEmails,
      clearPhoneNumbers,
      company: context.propsValue.company,
      jobTitle: context.propsValue.jobTitle,
      biography: context.propsValue.biography,
    };
    const { fields: requestedFields } = googleContactsPerson.buildPerson({ input });
    if (requestedFields.length === 0) {
      throw new Error(
        'Update Contact Fields needs at least one field to change; every field prop was left empty.'
      );
    }
    let current: Record<string, unknown>;
    try {
      current = await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.GET,
        path: `/${resourceName}`,
        queryParams: { personFields: requestedFields.join(',') },
      });
    } catch (error) {
      throw googleContactsApi.toApiError({
        error,
        operation: 'Update Contact Fields (reading the contact)',
      });
    }
    const etag = googleContactsApi.readString({ source: current, path: ['etag'] });
    if (etag === undefined) {
      throw new Error(
        'Update Contact Fields could not read the current etag of the contact; re-read the contact and retry.'
      );
    }
    const { person, fields } = googleContactsPerson.buildPerson({ input, current });
    try {
      return await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.PATCH,
        path: `/${resourceName}:updateContact`,
        queryParams: {
          updatePersonFields: fields.join(','),
          personFields: googleContactsApi.contactReadMask.join(','),
        },
        body: { etag, ...person },
      });
    } catch (error) {
      throw googleContactsApi.toApiError({
        error,
        operation: 'Update Contact Fields',
      });
    }
  },
});
