import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { googleContactsGroup } from '../common/contact-group';
import { batchGetContactGroupsOutputSchema } from '../output-schemas';

export const googleContactsBatchGetContactGroupsAction = createAction({
  auth: googleContactsAuth,
  name: 'batch_get_contact_groups',
  classification: 'READ',
  displayName: 'Batch Get Contact Groups',
  description: 'Read up to 200 contact groups in one call by their resource names.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads up to 200 Google Contacts groups in one call from a list of opaque resourceNames, returning succeeded and failed collections. Use it instead of repeated Get Contact Group calls; a whole-call success can still contain per-group failures, so always read the failed collection. Resolve the resource names with List Contact Groups. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: batchGetContactGroupsOutputSchema,
  props: {
    resourceNames: Property.Array({
      displayName: 'Resource Names',
      description:
        'Up to 200 opaque contact group resource names such as contactGroups/abc123, resolved with List Contact Groups.',
      required: true,
    }),
    maxMembers: Property.Number({
      displayName: 'Max Members',
      description:
        'How many member resource names to return per group. Defaults to 0, which returns none.',
      required: false,
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
    const maxMembers = Math.max(0, context.propsValue.maxMembers ?? 0);
    let response: Record<string, unknown>;
    try {
      response = await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.GET,
        path: '/contactGroups:batchGet',
        queryParams: {
          groupFields: googleContactsApi.contactGroupFields.join(','),
          maxMembers: String(maxMembers),
        },
        repeatedQueryParams: { resourceNames },
      });
    } catch (error) {
      throw googleContactsApi.toApiError({
        error,
        operation: 'Batch Get Contact Groups',
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
      payloadKey: 'contactGroup',
    });
    return {
      succeeded: succeeded.map((item) =>
        googleContactsGroup.summarizeGroup({ group: item.payload })
      ),
      failed,
      succeededCount: succeeded.length,
      failedCount: failed.length,
    };
  },
});
