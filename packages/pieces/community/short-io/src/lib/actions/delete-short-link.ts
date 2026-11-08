import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoSchemas } from '../common/output-schemas';

export const deleteShortLinkAction = createAction({
  auth: shortIoAuth,
  name: 'delete-short-link',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Short Link',
  description: 'Permanently delete a short link by its unique link ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a short link identified by its link ID (lnk_…); the short URL stops working and this cannot be undone. Not idempotent: a repeat call fails with a not-found error once the link is gone (Delete Short Link (AI) reports alreadyDeleted instead).',
    idempotent: false,
  },
  outputSchema: shortIoSchemas.legacyDelete,
  props: {
    linkId: Property.ShortText({
      displayName: 'Link ID',
      description: 'The ID of the short link you want to delete (e.g., lnk_61Mb_0dnRUg3vvtmAPZh3dhQh6)',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const linkId = shortIoClient.seg({ value: propsValue.linkId, label: 'Link ID' });
    try {
      const response = await shortIoClient.request({ method: HttpMethod.DELETE, auth, path: `/links/${linkId}` });
      return {
        success: true,
        message: `Short link with ID ${propsValue.linkId.trim()} deleted successfully`,
        data: response,
      };
    } catch (error) {
      return shortIoClient.rethrowWithHint({
        error,
        hints: { 404: `Short link with ID ${propsValue.linkId.trim()} not found. It may have already been deleted.` },
      });
    }
  },
});
