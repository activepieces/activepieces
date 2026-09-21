import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { googleContactsPerson } from '../common/person';
import { batchUpdateContactsOutputSchema } from '../output-schemas';

function toPerson({ entry, index }: { entry: unknown; index: number }): {
  resourceName: string;
  person: Record<string, unknown>;
  fields: string[];
} {
  const record = googleContactsApi.readRecord({ source: entry, path: [] });
  if (record === undefined) {
    throw new Error(`Contact ${index + 1} must be a Person object.`);
  }
  const resourceName = googleContactsApi.readString({
    source: record,
    path: ['resourceName'],
  });
  const etag = googleContactsApi.readString({ source: record, path: ['etag'] });
  if (resourceName === undefined || etag === undefined) {
    throw new Error(
      `Contact ${index + 1} must carry both resourceName and etag exactly as returned by Batch Get Contacts.`
    );
  }
  const fields = Object.keys(record).filter((key) =>
    googleContactsApi.updatablePersonFields.includes(key)
  );
  const person = Object.fromEntries(
    Object.entries(record).filter(
      ([key]) =>
        key === 'etag' ||
        key === 'resourceName' ||
        googleContactsApi.updatablePersonFields.includes(key)
    )
  );
  return { resourceName, person, fields };
}

export const googleContactsBatchUpdateContactsAction = createAction({
  auth: googleContactsAuth,
  name: 'batch_update_contacts',
  classification: 'WRITE',
  displayName: 'Batch Update Contacts',
  description: 'Update up to 200 contacts in a single call from full Person objects.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates up to 200 Google Contacts people in one call. Feed it the full Person objects returned by Batch Get Contacts, each still carrying its own resourceName and etag, with the values you want changed edited in place. One field mask is derived from the union of the field groups present on the submitted people and is applied to every one of them, so any masked group missing from a person is erased on that person — never hand-build partial Person objects here, and prefer Update Contact Fields for a single contact. Read the failed collection: a whole-call success can still hide per-contact failures, including stale-etag rejections. Safe to retry once the people have been re-read.',
    idempotent: true,
  },
  outputSchema: batchUpdateContactsOutputSchema,
  props: {
    contacts: Property.Json({
      displayName: 'Contacts',
      description:
        'JSON array of up to 200 full Person objects taken from Batch Get Contacts, each keeping its resourceName and etag, with the fields to change edited in place.',
      required: true,
    }),
  },
  async run(context) {
    const entries = context.propsValue.contacts;
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error(
        'Contacts must be a JSON array holding at least one Person object.'
      );
    }
    if (entries.length > 200) {
      throw new Error(
        `Contacts accepts at most 200 entries, received ${entries.length}.`
      );
    }
    const parsed = entries.map((entry, index) => toPerson({ entry, index }));
    const updateMask = parsed
      .flatMap((item) => item.fields)
      .filter((field, index, all) => all.indexOf(field) === index);
    if (updateMask.length === 0) {
      throw new Error(
        'None of the submitted people carry an updatable field group, so there is nothing to update.'
      );
    }
    const missing = parsed
      .filter((item) => updateMask.some((field) => !item.fields.includes(field)))
      .map((item) => item.resourceName);
    if (missing.length > 0) {
      throw new Error(
        `Every submitted person must carry the same field groups, because one update mask (${updateMask.join(
          ','
        )}) is applied to the whole batch and a missing group is erased. These people are missing at least one group: ${missing.join(
          ', '
        )}.`
      );
    }
    const contacts = Object.fromEntries(
      parsed.map((item) => [item.resourceName, item.person])
    );
    let response: Record<string, unknown>;
    try {
      response = await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.POST,
        path: '/people:batchUpdateContacts',
        body: {
          contacts,
          updateMask: updateMask.join(','),
          readMask: googleContactsApi.contactReadMask.join(','),
        },
      });
    } catch (error) {
      throw googleContactsApi.toApiError({
        error,
        operation: 'Batch Update Contacts',
      });
    }
    const updateResult = googleContactsApi.readRecord({
      source: response,
      path: ['updateResult'],
    });
    const items = Object.entries(updateResult ?? {}).map(
      ([resourceName, value]) => ({ resourceName, response: value })
    );
    const { succeeded, failed } = googleContactsApi.splitItemResponses({
      items,
      payloadKey: 'person',
    });
    return {
      succeeded: succeeded.map((item) => ({
        resourceName: item.resourceName,
        contact: googleContactsPerson.summarizePerson({ person: item.payload }),
        person: item.payload,
      })),
      failed,
      succeededCount: succeeded.length,
      failedCount: failed.length,
      updateMask: updateMask.join(','),
    };
  },
});
