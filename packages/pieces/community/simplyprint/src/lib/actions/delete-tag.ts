import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const deleteTagAction = createAction({
  auth: simplyprintAuth,
  name: 'delete_tag',
  displayName: 'Delete Tag',
  description:
    'Delete a custom tag from the account. The tag is removed from every printer/file/queue item it was attached to.',
  props: {
    tagId: Property.Number({
      displayName: 'Tag ID',
      description: 'Numeric custom tag ID to delete.',
      required: true,
    }),
  },
  async run(context) {
    // tags/Delete reads `id` from $this->GET (get_validation).
    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'tags/Delete',
      queryParams: { id: String(context.propsValue.tagId) },
    });
  },
});
