import { createAction } from '@activepieces/pieces-framework';
import { plausibleAuth } from '../..';
import { getCustomProperties, siteIdDropdown } from '../common';

export const listCustomProperties = createAction({
  auth: plausibleAuth,
  name: 'list_custom_properties',
  displayName: 'List Custom Properties',
  description: 'Get a list of custom properties for a site',
  props: {
    site_id: siteIdDropdown,
  },
  async run(context) {
    const customProperties = await getCustomProperties(
      context.auth.secret_text,
      context.propsValue['site_id']
    );
    return { custom_properties: customProperties };
  },
});
