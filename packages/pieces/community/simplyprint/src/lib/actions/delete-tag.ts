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
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes a custom tag from the account by its numeric tag ID, detaching it from every printer, file, and queue item it was attached to. Look up the ID via "List Tags" first. Idempotent in effect: the end state is the same whether or not the tag still existed.',
    idempotent: true,
  },
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
