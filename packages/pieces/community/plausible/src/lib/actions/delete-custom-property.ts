import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';
import { plausibleApiCall, siteIdDropdown, customPropertyDropdown } from '../common';

export const deleteCustomProperty = createAction({
  auth: plausibleAuth,
  name: 'delete_custom_property',
  displayName: 'Delete Custom Property',
  description: 'Delete a custom property from a site',
  audience: 'both',
  aiMetadata: { description: 'Removes a custom event property from a site, identified by the site and the property name. Use to stop tracking a custom dimension. Idempotent in effect, since the property ends up removed regardless of repeats.', idempotent: true },
  props: {
    site_id: siteIdDropdown,
    property: customPropertyDropdown,
  },
  async run(context) {
    const response = await plausibleApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      endpoint: `/sites/custom-props/${encodeURIComponent(context.propsValue['property'] as string)}`,
      body: {
        site_id: context.propsValue['site_id'],
      },
    });
    return response;
  },
});
