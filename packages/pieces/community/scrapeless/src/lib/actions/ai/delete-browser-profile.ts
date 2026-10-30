import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const deleteBrowserProfileAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_delete_browser_profile',
  displayName: 'Delete Browser Profile',
  description: 'Permanently deletes a browser profile and its stored data.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a browser profile and the cookies, logins and storage it holds. This cannot be undone.',
    idempotent: false,
  },
  props: {
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description:
        'The profileId, from List Browser Profiles or Create Browser Profile.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.deleteBrowserProfile({
      auth,
      profileId: propsValue.profileId,
    });
  },
});
