import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const createBrowserProfileAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_create_browser_profile',
  displayName: 'Create Browser Profile',
  description:
    'Creates a browser profile that keeps cookies and storage between sessions.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a browser profile that stores cookies, logins and local storage, and returns its profileId to pass to Create Browser Session so later sessions reuse that state.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'A name for the profile, e.g. "shop-login".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.createBrowserProfile({
      auth,
      name: propsValue.name,
    });
  },
});
