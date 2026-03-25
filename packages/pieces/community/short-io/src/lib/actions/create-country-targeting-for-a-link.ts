import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';
import { domainIdDropdown, linkIdDropdown } from '../common/props';

export const createCountryTargetingRuleAction = createAction({
  auth: shortIoAuth,
  name: 'create-country-targeting-rule',
  displayName: 'Create Country Targeting Rule',
  description: 'Set geographic targeting rules for a link with specific destination per country.',
  props: {
    domain: domainIdDropdown,
    linkId: linkIdDropdown,
    country: Property.ShortText({
      displayName: 'Country Code',
      description: 'ISO 3166-1 alpha-2 country code (e.g., US, GB, CA, IN). Must be exactly 2 characters.',
      required: true,
    }),
    originalURL: Property.ShortText({
      displayName: 'Country-Specific Redirect URL',
      description: 'The destination URL when users from this country access the link. Must be a valid URL.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { linkId, domain: domainString, country, originalURL } = propsValue;

    if (!country || country.trim().length !== 2) {
      throw new Error('Country code must be exactly 2 characters (e.g., US, GB, CA)');
    }

    const countryCode = country.trim().toUpperCase();

    try {
      new URL(originalURL);
    } catch (error) {
      throw new Error('Invalid URL format. Please provide a valid URL starting with http:// or https://');
    }

    const query: Record<string, string> = {};
    if (domainString) {
      const domainObject = JSON.parse(domainString as string);
      query['domainId'] = String(domainObject.id);
    }

    const body = {
      country: countryCode,
      originalURL,
    };

    try {
      const response = await shortIoApiCall({
        method: HttpMethod.POST,
        auth,
        resourceUri: `/link_country/${linkId}`,
        query,
        body,
      });

      return {
        success: true,
        message: `Country targeting rule for ${countryCode} created successfully`,
        data: response,
      };
    } catch (error: any) {
      if (error.message.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check the country code format and URL validity.'
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
      
      if (error.message.includes('409')) {
        throw new Error(
          `A country targeting rule for ${countryCode} already exists for this link.`
        );
      }
      
      if (error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to create country targeting rule: ${error.message}`);
    }
  },
});
