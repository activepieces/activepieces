import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { batchDeleteContactsOutputSchema } from '../output-schemas';

export const googleContactsBatchDeleteContactsAction = createAction({
  auth: googleContactsAuth,
  name: 'batch_delete_contacts',
  classification: 'DESTRUCTIVE',
  displayName: 'Batch Delete Contacts',
  description: 'Permanently delete up to 500 contacts in a single call.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes up to 500 Google Contacts people in one call from a list of opaque resourceNames. Irreversible and unrecoverable — the People API has no trash and there is no per-contact confirmation in the response, so verify every resourceName with Batch Get Contacts or List Contacts before calling and prefer Delete Contact when removing a single person. Not idempotent: a repeat call fails on contacts that are already gone.',
    idempotent: false,
  },
  outputSchema: batchDeleteContactsOutputSchema,
  props: {
    resourceNames: Property.Array({
      displayName: 'Resource Names',
      description:
        'Up to 500 opaque contact resource names such as people/c12345. Every listed contact is deleted permanently and cannot be restored.',
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
      max: 500,
      label: 'Resource Names',
    });
    try {
      await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.POST,
        path: '/people:batchDeleteContacts',
        body: { resourceNames },
      });
    } catch (error) {
      throw googleContactsApi.toApiError({
        error,
        operation: 'Batch Delete Contacts',
      });
    }
    return { deleted: true, resourceNames, count: resourceNames.length };
  },
});
