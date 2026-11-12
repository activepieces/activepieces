import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApi, pathFor } from '../common/client';
import { listIdDropdown } from '../common/props';
import { klaviyoInputs } from '../common/ai-props';
import { klaviyoOutputSchemas } from '../common/output-schemas';

export const deleteList = createAction({
  auth: klaviyoAuth,
  name: 'delete_list',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete List',
  description: 'Permanently delete a list. The profiles in it are kept, but flows and forms that use the list stop working.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently deletes a Klaviyo list; the profiles are kept but lose this membership, and flows or sign-up forms that use the list break. Cannot be undone. Find the list ID with List Lists or Find List by Name. Not idempotent: a repeat fails with 404 because the list is gone.',
    idempotent: false,
  },
  outputSchema: klaviyoOutputSchemas.deleteList,
  props: {
    list_id: listIdDropdown,
  },
  async run({ auth, propsValue }) {
    const listId = klaviyoInputs.requireText({ value: propsValue.list_id, label: 'List Id' });
    await klaviyoApi.send({ auth, method: HttpMethod.DELETE, path: pathFor(['lists', listId]) });
    return { deleted: true, list_id: listId };
  },
});
