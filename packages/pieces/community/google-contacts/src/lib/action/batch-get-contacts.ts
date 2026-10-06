import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { googleContactsPerson } from '../common/person';
import { batchGetContactsOutputSchema } from '../output-schemas';

export const googleContactsBatchGetContactsAction = createAction({
  auth: googleContactsAuth,
  name: 'batch_get_contacts',
  classification: 'READ',
  displayName: 'Batch Get Contacts',
  description: 'Read up to 200 contacts in one call by their resource names.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads up to 200 Google Contacts people in one call from a list of opaque resourceNames and returns each full contact with its current etag, split into succeeded and failed collections. Use it instead of repeated Get Contact calls, and as the input source for Batch Update Contacts. A whole-call success can still contain per-contact failures, so always read the failed collection. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: batchGetContactsOutputSchema,
  props: {
    resourceNames: Property.Array({
      displayName: 'Resource Names',
      description:
        'Up to 200 opaque contact resource names such as people/c12345, resolved with List Contacts or Search Contacts.',
      required: true,
    }),
  },
  async run(context) {
    const resourceNames = googleContactsApi.toStringList({
      value: context.propsValue.resourceNames,
      label: 'Resource Names',
    });
    googleContactsApi.assertBatchSize({
      values: resourceNames,
      max: 200,
      label: 'Resource Names',
    });
    let response: Record<string, unknown>;
    try {
      response = await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.GET,
        path: '/people:batchGet',
        queryParams: {
          personFields: googleContactsApi.contactReadMask.join(','),
        },
        repeatedQueryParams: { resourceNames },
      });
    } catch (error) {
      throw googleContactsApi.toApiError({
        error,
        operation: 'Batch Get Contacts',
      });
    }
    const items = googleContactsApi
      .readArray({ source: response, path: ['responses'] })
      .map((item, index) => ({
        resourceName:
          googleContactsApi.readString({
            source: item,
            path: ['requestedResourceName'],
          }) ??
          resourceNames[index] ??
          '',
        response: item,
      }));
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
    };
  },
});
