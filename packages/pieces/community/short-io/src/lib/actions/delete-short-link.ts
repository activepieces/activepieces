import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';
// Make sure to import the property for selecting a domain
import { domainIdDropdown, linkIdDropdown } from '../common/props';

export const deleteShortLinkAction = createAction({
  auth: shortIoAuth,
  name: 'delete-short-link',
  displayName: 'Delete Short Link',
  description: 'Delete a short link by its unique link ID.',
  props: {
    domain: domainIdDropdown,
  },
  async run({ propsValue, auth }) {
    const linkId = 'lnk_61Mb_0dnRUg3vvtmAPZh3dhQh6';

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
