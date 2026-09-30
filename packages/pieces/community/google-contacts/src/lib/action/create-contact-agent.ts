import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { googleContactsPerson } from '../common/person';
import { createContactOutputSchema } from '../output-schemas';

export const googleContactsCreateContactAction = createAction({
  auth: googleContactsAuth,
  name: 'create_contact',
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Create a new contact in the connected Google account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one new person in the connected Google Contacts account from name, nickname, email, phone, organization and notes fields. Supply at least one of name, email or phone; email addresses and phone numbers are arrays of strings, so pass ["ada@example.com"] rather than a bare string. Use Batch Create Contacts for many at once, and Update Contact Fields to change someone who already exists. Not idempotent — every call creates a separate person, so check with Search Contacts first if duplicates matter.',
    idempotent: false,
  },
  outputSchema: createContactOutputSchema,
  props: {
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
        'Array of email address strings, for example ["ada@example.com"]. A single address still has to be wrapped in an array.',
      required: false,
    }),
    phoneNumbers: Property.Array({
      displayName: 'Phone Numbers',
      description:
        'Array of phone number strings, for example ["+1 555 0100"]. A single number still has to be wrapped in an array.',
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
      description: 'Free-text notes stored on the contact biography.',
      required: false,
    }),
  },
  async run(context) {
    const emails = googleContactsApi.toStringList({
      value: context.propsValue.emails,
      label: 'Email Addresses',
    });
    const phoneNumbers = googleContactsApi.toStringList({
      value: context.propsValue.phoneNumbers,
      label: 'Phone Numbers',
    });
    const { person, fields } = googleContactsPerson.buildPerson({
      input: {
        firstName: context.propsValue.firstName,
        middleName: context.propsValue.middleName,
        lastName: context.propsValue.lastName,
        nickname: context.propsValue.nickname,
        emails,
        phoneNumbers,
        company: context.propsValue.company,
        jobTitle: context.propsValue.jobTitle,
        biography: context.propsValue.biography,
      },
    });
    if (fields.length === 0) {
      throw new Error(
        'Create Contact needs at least one of first name, last name, email address or phone number.'
      );
    }
    try {
      return await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.POST,
        path: '/people:createContact',
        queryParams: {
          personFields: googleContactsApi.contactReadMask.join(','),
        },
        body: person,
      });
    } catch (error) {
      throw googleContactsApi.toApiError({ error, operation: 'Create Contact' });
    }
  },
});
