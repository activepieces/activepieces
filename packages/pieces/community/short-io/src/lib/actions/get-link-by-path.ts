import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';

export const getLinkByPathAction = createAction({
  auth: shortIoAuth,
  name: 'get-short-link-info-by-path',
  displayName: 'Get Short Link Info by Path',
  description: 'Retrieve details of a short link using its domain and path.',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'The Short.io domain associated with the short link (e.g., yourdomain.short.gy)',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'The custom or auto-generated path/slug for the short link (e.g., abc123)',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { domain, path } = propsValue;

    const query = {
      domain,
      path,
    };

    try {
      const response = await shortIoApiCall({
        method: HttpMethod.GET,
        auth,
        resourceUri: `/links/expand`,
        query,
      });

      return {
        success: true,
        message: 'Short link info retrieved successfully.',
        data: response,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch short link info: ${error.message}`);
    }
  },
});
