import { createAction, Property } from '@activepieces/pieces-framework';
import { shortioCommon, shortioAuth, shortioApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const expireLink = createAction({
  auth: shortioAuth,
  name: 'expireLink',
  displayName: 'Expire Link',
  description: 'Set an expiration by date or click limit',
  props: {
    domain_id: shortioCommon.domain_id,
    link_id: shortioCommon.link_id,
    expiresAt: Property.DateTime({
      displayName: 'Expiration Date',
      description: 'Expiration date in ISO format (e.g. 2025-07-16T23:59:59Z) or milliseconds',
      required: false,
    }),
    clicksLimit: Property.Number({
      displayName: 'Clicks Limit',
      description: 'Disable link after specified number of clicks (≥ 1)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { domain_id, link_id, expiresAt, clicksLimit } = propsValue;

    const body: Record<string, string | number> = {};

    if (expiresAt) {
      body['expiresAt'] = expiresAt;
    }
    
    if (clicksLimit) {
      body['clicksLimit'] = clicksLimit;
    }

    const response = await shortioApiCall({
      apiKey: auth,
      method: HttpMethod.POST,
      resourceUri: `/links/${link_id}`,
      query: { domain_id },
      body,
    });
    
    return response;
  },
});
