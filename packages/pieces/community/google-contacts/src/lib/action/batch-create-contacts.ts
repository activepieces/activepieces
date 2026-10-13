import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { googleContactsPerson } from '../common/person';
import { batchCreateContactsOutputSchema } from '../output-schemas';

function optionalString({ source, key }: { source: unknown; key: string }): string | undefined {
  const value = googleContactsApi.readString({ source, path: [key] });
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }
  return value.trim();
}

export const googleContactsBatchCreateContactsAction = createAction({
  auth: googleContactsAuth,
  name: 'batch_create_contacts',
  classification: 'WRITE',
  displayName: 'Batch Create Contacts',
  description: 'Create up to 200 contacts in a single call.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates up to 200 new Google Contacts people in one call and returns the created contacts split into succeeded and failed collections. Use it instead of repeated Create Contact calls when importing a list; a whole-call success can still contain per-contact failures, so always read the failed collection. Not idempotent — every call creates new people, so a retry after a partial failure duplicates the ones that already succeeded.',
    idempotent: false,
  },
  outputSchema: batchCreateContactsOutputSchema,
  props: {
    contacts: Property.Array({
      displayName: 'Contacts',
      description: 'Up to 200 contacts to create. Each needs at least a name, an email or a phone number.',
      required: true,
      properties: {
        firstName: Property.ShortText({ displayName: 'First Name', required: false }),
        middleName: Property.ShortText({ displayName: 'Middle Name', required: false }),
        lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
        email: Property.ShortText({ displayName: 'Email Address', required: false }),
        phoneNumber: Property.ShortText({ displayName: 'Phone Number', required: false }),
        company: Property.ShortText({ displayName: 'Company', required: false }),
        jobTitle: Property.ShortText({ displayName: 'Job Title', required: false }),
      },
    }),
  },
  async run(context) {
    const entries = context.propsValue.contacts;
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error('Contacts must contain at least one entry.');
    }
    if (entries.length > 200) {
      throw new Error(
        `Contacts accepts at most 200 entries, received ${entries.length}.`
      );
    }
    const people = entries.map((entry, index) => {
      const email = optionalString({ source: entry, key: 'email' });
      const phoneNumber = optionalString({ source: entry, key: 'phoneNumber' });
      const { person, fields } = googleContactsPerson.buildPerson({
        input: {
          firstName: optionalString({ source: entry, key: 'firstName' }),
          middleName: optionalString({ source: entry, key: 'middleName' }),
          lastName: optionalString({ source: entry, key: 'lastName' }),
          emails: email === undefined ? [] : [email],
          phoneNumbers: phoneNumber === undefined ? [] : [phoneNumber],
          company: optionalString({ source: entry, key: 'company' }),
          jobTitle: optionalString({ source: entry, key: 'jobTitle' }),
        },
      });
      if (fields.length === 0) {
        throw new Error(
          `Contact ${index + 1} needs at least one of first name, last name, email address or phone number.`
        );
      }
      return { contactPerson: person };
    });
    let response: Record<string, unknown>;
    try {
      response = await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.POST,
        path: '/people:batchCreateContacts',
        body: {
          contacts: people,
          readMask: googleContactsApi.contactReadMask.join(','),
        },
      });
    } catch (error) {
      throw googleContactsApi.toApiError({
        error,
        operation: 'Batch Create Contacts',
      });
    }
    const created = googleContactsApi.readArray({
      source: response,
      path: ['createdPeople'],
    });
    const succeeded = created
      .map((item, index) => ({ item, index }))
      .filter((entry) => !googleContactsApi.isFailedItem({ response: entry.item }))
      .map((entry) => {
        const payload = googleContactsApi.readValue({
          source: entry.item,
          path: ['person'],
        });
        return {
          requestIndex: entry.index + 1,
          resourceName: googleContactsApi.readString({
            source: payload,
            path: ['resourceName'],
          }),
          contact: googleContactsPerson.summarizePerson({ person: payload }),
        };
      });
    const failed = created
      .map((item, index) => ({ item, index }))
      .filter((entry) => googleContactsApi.isFailedItem({ response: entry.item }))
      .map((entry) => ({
        requestIndex: entry.index + 1,
        status: googleContactsApi.describeStatus({
          status: googleContactsApi.readValue({
            source: entry.item,
            path: ['status'],
          }),
        }),
      }));
    return {
      succeeded,
      failed,
      succeededCount: succeeded.length,
      failedCount: failed.length,
      requestedCount: people.length,
    };
  },
});
