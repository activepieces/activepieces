import { createAction, Property } from '@activepieces/pieces-framework';
import { shortioAuth, shortioCommon, shortioApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createCountryTargetingForALink = createAction({
  auth: shortioAuth,
  name: 'create_country_targeting_for_a_link',
  displayName: 'Create Country Targeting for a Link',
  description: 'Set geographic targeting rules for a link with specific destination per country',
  props: {
    domain_id: shortioCommon.domain_id,
    link_id: shortioCommon.link_id,
    country: Property.ShortText({
      displayName: 'Country Code',
      description: 'ISO 3166-1 alpha-2 country code (e.g., US, CA, GB, DE, FR)',
      required: true,
    }),
    originalURL: Property.ShortText({
      displayName: 'Original URL',
      description: 'The destination URL for this specific country (must be a valid URI)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const props = propsValue;
    
    const response = await shortioApiCall({
      apiKey: auth,
      method: HttpMethod.POST,
      resourceUri: `/link_country/${props.link_id}`,
      query: {
        domainId: props.domain_id,
      },
      body: {
        country: props.country,
        originalURL: props.originalURL,
      },
    });

    return response;
  },
});
