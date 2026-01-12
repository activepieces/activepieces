import { createAction, Property } from '@activepieces/pieces-framework';
import { influencersClubAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const enrichCreatorByEmail = createAction({
  auth: influencersClubAuth,
  name: 'enrichCreatorByEmail',
  displayName: 'Enrich Creator by Email',
  description:
    'Enrich creator data by email address with advanced mode including all social medias and full profile stats',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the creator to enrich',
      required: true,
    }),
    exclude_platforms: Property.StaticMultiSelectDropdown({
      displayName: 'Exclude Platforms',
      description: 'Platforms to exclude from enrichment (optional)',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Instagram', value: 'instagram' },
          { label: 'TikTok', value: 'tiktok' },
          { label: 'YouTube', value: 'youtube' },
          { label: 'Twitter', value: 'twitter' },
          { label: 'Twitch', value: 'twitch' },
          { label: 'OnlyFans', value: 'onlyfans' },
          { label: 'LinkedIn', value: 'linkedin' },
          { label: 'Facebook', value: 'facebook' },
          { label: 'Snapchat', value: 'snapchat' },
          { label: 'Reddit', value: 'reddit' },
          { label: 'Pinterest', value: 'pinterest' },
          { label: 'Discord', value: 'discord' },
        ],
      },
    }),
    min_followers: Property.Number({
      displayName: 'Minimum Followers',
      description: 'Minimum follower count filter (default: 1000)',
      required: false,
      defaultValue: 1000,
    }),
  },
  async run(context) {
    const body: any = {
      email: context.propsValue.email,
    };

    if (
      context.propsValue.exclude_platforms &&
      context.propsValue.exclude_platforms.length > 0
    ) {
      body.exclude_platforms = context.propsValue.exclude_platforms;
    }

    if (
      context.propsValue.min_followers !== undefined &&
      context.propsValue.min_followers !== null
    ) {
      body.min_followers = context.propsValue.min_followers;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/creators/enrich/email/advanced',
      body
    );

    return response;
  },
});
