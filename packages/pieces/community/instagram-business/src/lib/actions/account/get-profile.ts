import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { getProfileOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const getProfile = createAction({
  auth: instagramCommon.authentication,
  outputSchema: getProfileOutputSchema,
  name: 'get_profile',
  classification: 'READ',
  displayName: 'Get Profile',
  description: 'Read the profile of the connected Instagram professional account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads the profile of one Instagram professional account: username, name, biography, website, profile picture, follower count, follows count and total media count. Use it to identify the connected account or to check follower numbers. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    page: instagramCommon.page,
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;

    return instagramCommon.graphRequest<InstagramProfile>({
      method: HttpMethod.GET,
      resourceUri: `/${page.id}`,
      accessToken: page.accessToken,
      query: {
        fields:
          'id,username,name,biography,website,profile_picture_url,followers_count,follows_count,media_count',
      },
    });
  },
});

type InstagramProfile = {
  id: string;
  username?: string;
  name?: string;
  biography?: string;
  website?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
};
