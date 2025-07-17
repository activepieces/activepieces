import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';
import { domainIdDropdown } from '../common/props';

export const getLinkByPathAction = createAction({
  auth: shortIoAuth,
  name: 'get-short-link-info-by-path',
  displayName: 'Get Short Link Info by Path',
  description: 'Retrieve details of a short link using its domain and path.',
  props: {
    domain: domainIdDropdown,
    path: Property.ShortText({
      displayName: 'Path',
      description: 'The custom or auto-generated path/slug for the short link (e.g., abc123)',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { domain: domainString, path } = propsValue;

    if (!domainString) {
      throw new Error('Domain is a required field.');
    }

    const domainObject = JSON.parse(domainString as string);

    const query = {
      domain: domainObject.hostname,
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
