import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pocketbaseAuth } from '../../index';
import { pocketbaseAuthenticate, normalizeHost } from '../common/client';

export const deleteRecord = createAction({
  name: 'deleteRecord',
  displayName: 'Delete Record',
  description: 'Deletes a single record from a collection',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes one record from a PocketBase collection by its record ID. Use when you need to remove a specific record you can identify by ID. Idempotent on the end state — the record ends up absent — though a repeat call against an already-deleted ID will error since the record no longer exists.', idempotent: true },
  auth: pocketbaseAuth,
  props: {
    collection: Property.ShortText({
      displayName: 'Collection Name',
      description: 'The name of the PocketBase collection',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'ID of the record to delete',
      required: true,
    }),
  },
  async run(context) {
    const { host: rawHost, email, password } = context.auth.props;
    const host = normalizeHost(rawHost);
    const { collection, recordId } = context.propsValue;

    const token = await pocketbaseAuthenticate(host, email, password);

    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${host}/api/collections/${encodeURIComponent(collection)}/records/${encodeURIComponent(recordId)}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return { success: true };
  },
});
