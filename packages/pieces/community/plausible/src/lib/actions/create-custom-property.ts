import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';
import { plausibleApiCall, siteIdDropdown } from '../common';

export const createCustomProperty = createAction({
  auth: plausibleAuth,
  name: 'create_custom_property',
  displayName: 'Create Custom Property',
  description: 'Create a custom property for a site',
  props: {
    site_id: siteIdDropdown,
    property: Property.ShortText({
      displayName: 'Property Name',
      description: 'Name of the custom property',
      required: true,
    }),
  },
  async run(context) {
    const response = await plausibleApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      endpoint: '/sites/custom-props',
      body: {
        site_id: context.propsValue['site_id'],
        property: context.propsValue['property'],
      },
    });
    return response;
  },
});
