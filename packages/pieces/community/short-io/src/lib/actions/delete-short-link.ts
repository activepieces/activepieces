import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';

export const deleteShortLinkAction = createAction({
  auth: shortIoAuth,
  name: 'delete-short-link',
  displayName: 'Delete Short Link',
  description: 'Delete a short link by its unique link ID.',
  props: {
    linkId: Property.ShortText({
      displayName: 'Link ID',
      description: 'The ID of the short link you want to delete (e.g., lnk_61Mb_0dnRUg3vvtmAPZh3dhQh6)',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const linkId = propsValue.linkId;

    try {
      await shortIoApiCall({
        method: HttpMethod.DELETE,
        auth,
        resourceUri: `/links/${linkId}`,
      });

      return {
        success: true,
        message: `Short link with ID ${linkId} deleted successfully.`,
      };
    } catch (error: any) {
      throw new Error(`Failed to delete short link: ${linkId} ${error.message} `);
    }
  },
});
