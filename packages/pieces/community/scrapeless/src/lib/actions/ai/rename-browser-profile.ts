import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const renameBrowserProfileAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_rename_browser_profile',
  displayName: 'Rename Browser Profile',
  description: 'Renames a browser profile.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes the name of a browser profile; its stored browser data is kept.',
    idempotent: true,
  },
  props: {
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description:
        'The profileId, from List Browser Profiles or Create Browser Profile.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The new name for the profile.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.renameBrowserProfile({
      auth,
      profileId: propsValue.profileId,
      name: propsValue.name,
    });
  },
});
