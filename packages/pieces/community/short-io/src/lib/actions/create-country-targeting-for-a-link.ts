import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';

export const createCountryTargetingRuleAction = createAction({
  auth: shortIoAuth,
  name: 'create-country-targeting-rule',
  displayName: 'Create Country Targeting Rule',
  description: 'Add a new country-based redirect rule to an existing short link using the country ISO code.',
  props: {
    linkId: Property.ShortText({
      displayName: 'Link ID',
      description: 'The ID of the short link you want to add country targeting to.',
      required: true,
    }),
    country: Property.ShortText({
      displayName: 'Country ISO Code (e.g., US)',
      description: 'Use ISO 3166-1 alpha-2 country code (e.g., US for United States, IN for India).',
      required: true,
    }),
    originalURL: Property.ShortText({
      displayName: 'Redirect URL for Country',
      description: 'The destination URL when users from this country access the link.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { linkId, country, originalURL } = propsValue;

    const body = {
      country,
      originalURL,
    };

    try {
      const response = await shortIoApiCall({
        method: HttpMethod.POST,
        auth,
        resourceUri: `/link_country/${linkId}`,
        body,
      });

      return {
        success: true,
        message: 'Country targeting rule created successfully.',
        data: response,
      };
    } catch (error: any) {
      throw new Error(`Failed to create country targeting rule: ${error.message}`);
    }
  },
});
