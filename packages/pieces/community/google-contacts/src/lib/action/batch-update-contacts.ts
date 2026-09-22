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

function groupBySignature({
  parsed,
}: {
  parsed: { resourceName: string; person: Record<string, unknown>; fields: string[] }[];
}): { updateMask: string; contacts: Record<string, Record<string, unknown>> }[] {
  const groups = new Map<string, Record<string, Record<string, unknown>>>();
  for (const item of parsed) {
    const signature = [...item.fields].sort().join(',');
    const existing = groups.get(signature);
    if (existing === undefined) {
      groups.set(signature, { [item.resourceName]: item.person });
    } else {
      existing[item.resourceName] = item.person;
    }
  }
  return [...groups.entries()].map(([updateMask, contacts]) => ({
    updateMask,
    contacts,
  }));
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
      'Updates up to 200 Google Contacts people in one call. Feed it the full Person objects returned by Batch Get Contacts, each still carrying its own resourceName and etag, with the values you want changed edited in place. The people are grouped by which field groups they carry and one request is issued per group, so a person carrying only a phone number and a person carrying only an email can be updated together; each request uses the field mask of its own group. Within a group the mask is applied to every person in it, so never hand-build partial Person objects here — a group a person no longer carries is erased on that person. Prefer Update Contact Fields for a single contact. Because the work is split across requests, this action can partially apply: one group can be written while another is rejected outright. It therefore does not throw when a request fails — it records every contact in that request under failed and carries on. Never treat a returned result as wholesale success and never assume an absent error means everything applied; always read failed and failedCount, which also cover per-contact rejections such as stale etags. Every submitted person must carry at least one updatable field group. Before retrying, re-read the people so the already-updated ones carry fresh etags.',
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
    const withoutGroups = parsed
      .filter((item) => item.fields.length === 0)
      .map((item) => item.resourceName);
    if (withoutGroups.length > 0) {
      throw new Error(
        `Every submitted person must carry at least one updatable field group, because a person with no group has nothing to update. These people carry none: ${withoutGroups.join(
          ', '
        )}.`
      );
    }
    const groups = groupBySignature({ parsed });
    const succeeded: { resourceName: string; contact: Record<string, unknown>; person: unknown }[] =
      [];
    const failed: { resourceName: string; status: string; updateMask: string }[] = [];
    for (const group of groups) {
      let response: Record<string, unknown>;
      try {
        response = await googleContactsApi.sendRequest({
          accessToken: context.auth.access_token,
          method: HttpMethod.POST,
          path: '/people:batchUpdateContacts',
          body: {
            contacts: group.contacts,
            updateMask: group.updateMask,
            readMask: googleContactsApi.contactReadMask.join(','),
          },
        });
      } catch (error) {
        const status = googleContactsApi.toApiError({
          error,
          operation: `Batch Update Contacts (field mask ${group.updateMask})`,
        }).message;
        for (const resourceName of Object.keys(group.contacts)) {
          failed.push({ resourceName, status, updateMask: group.updateMask });
        }
        continue;
      }
      const updateResult = googleContactsApi.readRecord({
        source: response,
        path: ['updateResult'],
      });
      const items = Object.entries(updateResult ?? {}).map(
        ([resourceName, value]) => ({ resourceName, response: value })
      );
      const split = googleContactsApi.splitItemResponses({
        items,
        payloadKey: 'person',
      });
      for (const item of split.succeeded) {
        succeeded.push({
          resourceName: item.resourceName,
          contact: googleContactsPerson.summarizePerson({ person: item.payload }),
          person: item.payload,
        });
      }
      for (const item of split.failed) {
        failed.push({
          resourceName: item.resourceName,
          status: item.status,
          updateMask: group.updateMask,
        });
      }
    }
    return {
      succeeded,
      failed,
      succeededCount: succeeded.length,
      failedCount: failed.length,
      updateMasks: groups.map((group) => group.updateMask),
    };
  },
});
