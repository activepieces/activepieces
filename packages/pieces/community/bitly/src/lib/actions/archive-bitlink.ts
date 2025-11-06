import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { bitlyApiCall } from '../common/client';
import { bitlyAuth } from '../common/auth';
import { bitlinkDropdown, groupGuid } from '../common/props';

export const archiveBitlinkAction = createAction({
  auth: bitlyAuth,
  name: 'archive_bitlink',
  displayName: 'Archive Bitlink',
  description: 'Archive a Bitlink to stop redirects.',
  props: {
    group_guid: groupGuid,
    bitlink: bitlinkDropdown,
  },
  async run(context) {
    const { bitlink } = context.propsValue;

    try {
      const body = {
        archived: true,
      };

      return await bitlyApiCall({
        method: HttpMethod.PATCH,
        auth: context.auth,
        resourceUri: `/bitlinks/${bitlink}`,
        body,
      });

    } catch (error: any) {
      const errorMessage = error.response?.data?.description || error.response?.data?.message || error.message;

      if (error.response?.status === 429) {
        throw new Error(
          'Rate limit exceeded. Please wait before trying again.'
        );
      }

      if (error.response?.status === 404) {
        throw new Error(
          `Bitlink not found: ${errorMessage}. Please verify the link (e.g., 'bit.ly/xyz123') is correct.`
        );
      }

      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error(
          `Authentication failed or forbidden: ${errorMessage}. Please check your Access Token and permissions.`
        );
      }

      throw new Error(
        `Failed to archive Bitlink: ${errorMessage || 'Unknown error occurred'}`
      );
    }
  },
});
