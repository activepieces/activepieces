import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';
import { domainIdDropdown, linkIdDropdown } from '../common/props';

export const expireShortLinkAction = createAction({
  auth: shortIoAuth,
  name: 'expire-short-link',
  displayName: 'Expire Short Link',
  description: 'Set an expiration date or click limit to deactivate a short link.',
  props: {
    domain: domainIdDropdown,
    linkId: linkIdDropdown,
    expiresAt: Property.DateTime({
      displayName: 'Expiration Date',
      description: 'The date and time when the link will become inactive.',
      required: false,
    }),
    clicksLimit: Property.Number({
      displayName: 'Clicks Limit',
      description: 'Disable link after specified number of clicks (minimum: 1)',
      required: false,
    }),
    expiredURL: Property.ShortText({
      displayName: 'Expired Redirect URL',
      description: 'Optional URL to redirect users when the link has expired.',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { 
      linkId, 
      domain: domainString,
      expiresAt,
      clicksLimit,
      expiredURL,
    } = propsValue;

    if (!expiresAt && !clicksLimit) {
      throw new Error('You must provide either an expiration date or a clicks limit to expire the link.');
    }

    if (clicksLimit && clicksLimit < 1) {
      throw new Error('Clicks limit must be at least 1');
    }

    const query: Record<string, string> = {};
    if (domainString) {
      const domainObject = JSON.parse(domainString as string);
      query['domain_id'] = String(domainObject.id);
    }

    const body: Record<string, unknown> = {};
    
    if (expiresAt) {
      body['expiresAt'] = expiresAt;
    }
    
    if (clicksLimit) {
      body['clicksLimit'] = clicksLimit;
    }
    
    if (expiredURL && expiredURL.trim() !== '') {
      body['expiredURL'] = expiredURL;
    }

    try {
      const response = await shortIoApiCall({
        method: HttpMethod.POST,
        auth,
        resourceUri: `/links/${linkId}`,
        query,
        body,
      });

      return {
        success: true,
        message: 'Short link expiration settings updated successfully',
        data: response,
      };
    } catch (error: any) {
      if (error.message.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check your expiration settings and try again.'
        );
      }
      
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication failed. Please check your API key and permissions.'
        );
      }
      
      if (error.message.includes('404')) {
        throw new Error(
          'Short link not found. Please check the link ID and try again.'
        );
      }
      
      if (error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to set link expiration: ${error.message}`);
    }
  },
}); 