import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const deleteList = createAction({
  auth: villageAuth,
  name: 'delete_list',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete a list',
  description:
    'Permanently delete a list and all its items. This action cannot be undone.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently delete an entire list and all its items by list ID; this cannot be undone. To remove only specific entries while keeping the list, use Remove items from list instead. A repeat call on a deleted list is expected to fail with not found.',
    idempotent: false,
  },
  outputSchema: villageSchemas.messageResult,
  props: {
    id: Property.ShortText({
      displayName: 'List ID',
      description: 'List ID',
      required: true,
    }),
  },
  async run(context) {
    const { id } = context.propsValue;

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/v2/lists/${encodeURIComponent(id)}`,
    });
    return response;
  },
});
