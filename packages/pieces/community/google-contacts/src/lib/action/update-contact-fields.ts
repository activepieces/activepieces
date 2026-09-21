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
      'Updates an existing Google Contacts person, changing only the fields you supply and leaving every other field untouched. It reads the contact first, so it resolves the required etag and field mask itself — you never pass them. Supply the opaque resourceName from List Contacts or Search Contacts. Email and phone lists replace the stored list for that field wholesale; first/middle/last name and company/job title are merged over the current values. Safe to retry: re-applying the same values converges, and a concurrent edit surfaces as a re-read-and-retry error.',
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
        'Array of email address strings, for example ["ada@example.com"]. Replaces every email address stored on the contact. Leave empty to keep the stored addresses.',
      required: false,
    }),
    phoneNumbers: Property.Array({
      displayName: 'Phone Numbers',
      description:
        'Array of phone number strings, for example ["+1 555 0100"]. Replaces every phone number stored on the contact. Leave empty to keep the stored numbers.',
      required: false,
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
    const input = {
      firstName: context.propsValue.firstName,
      middleName: context.propsValue.middleName,
      lastName: context.propsValue.lastName,
      nickname: context.propsValue.nickname,
      emails: googleContactsApi.toStringList({
        value: context.propsValue.emails,
        label: 'Email Addresses',
      }),
      phoneNumbers: googleContactsApi.toStringList({
        value: context.propsValue.phoneNumbers,
        label: 'Phone Numbers',
      }),
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
