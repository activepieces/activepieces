import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';
import { domainIdDropdown } from '../common/props';

export const getLinkByPathAction = createAction({
  auth: shortIoAuth,
  name: 'get-short-link-info-by-path',
  displayName: 'Get Link by Path',
  description: 'Retrieve detailed information about a short link using its domain and path.',
  props: {
    domain: domainIdDropdown,
    path: Property.ShortText({
      displayName: 'Link Path',
      description: 'The path/slug of the short link (e.g., "abc123", "my-link"). Do not include domain or slashes.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { domain: domainString, path } = propsValue;

    if (!domainString) {
      throw new Error('Domain is required. Please select a domain first.');
    }

    if (!path || path.trim() === '') {
      throw new Error('Path is required and cannot be empty.');
    }

    const cleanPath = path.trim();
    
    if (cleanPath.includes('/') || cleanPath.includes('http')) {
      throw new Error('Path should only contain the slug (e.g., "abc123"), not the full URL or domain.');
    }

    const domainObject = JSON.parse(domainString as string);

    const query = {
      domain: domainObject.hostname,
      path: cleanPath,
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
        message: `Link information for "${cleanPath}" retrieved successfully`,
        data: response,
      };
    } catch (error: any) {
      if (error.message.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check the domain and path values.'
        );
      }
      
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication failed. Please check your API key and permissions.'
        );
      }
      
      if (error.message.includes('404')) {
        throw new Error(
          `Short link with path "${cleanPath}" not found on domain "${domainObject.hostname}". Please verify the path exists.`
        );
      }
      
      if (error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to retrieve link information: ${error.message}`);
    }
  },
});
