import { createAction, Property } from '@activepieces/pieces-framework';
import { influencersClubAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findSimilarCreator = createAction({
  auth: influencersClubAuth,
  name: 'findSimilarCreator',
  displayName: 'Find Similar Creator',
  description:
    'Find creators similar to a given creator handle or profile URL with optional filters',
  props: {
    platform: Property.StaticDropdown({
      displayName: 'Platform',
      description: 'The social media platform',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Instagram', value: 'instagram' },
          { label: 'TikTok', value: 'tiktok' },
          { label: 'YouTube', value: 'youtube' },
          { label: 'Twitch', value: 'twitch' },
          { label: 'Twitter/X', value: 'twitter' },
          { label: 'OnlyFans', value: 'onlyfans' },
        ],
      },
    }),
    filter_key: Property.StaticDropdown({
      displayName: 'Filter Key',
      description: 'The type of identifier for the creator',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'URL', value: 'url' },
          { label: 'Username', value: 'username' },
          { label: 'ID', value: 'id' },
        ],
      },
    }),
    filter_value: Property.ShortText({
      displayName: 'Filter Value',
      description: 'Platform URL, profile handle, or user ID',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Results Limit',
      description:
        'Maximum number of similar creators to return (min: 1, max: 50)',
      required: false,
      defaultValue: 10,
    }),
    number_of_followers: Property.Object({
      displayName: 'Follower Count Range',
      description: 'Filter by follower count (min and max)',
      required: false,
    }),
    engagement_percent: Property.Object({
      displayName: 'Engagement Percentage Range',
      description: 'Filter by engagement rate (min and max)',
      required: false,
    }),
    is_verified: Property.Checkbox({
      displayName: 'Verified Only',
      description: 'Only return verified creators',
      required: false,
    }),
    exclude_private_profile: Property.Checkbox({
      displayName: 'Exclude Private Profiles',
      description: 'Exclude creators with private profiles',
      required: false,
    }),
  },
  async run(context) {
    const body: any = {
      platform: context.propsValue.platform,
      filter_key: context.propsValue.filter_key,
      filter_value: context.propsValue.filter_value,
      filters: {},
      paging: {
        limit: context.propsValue.limit || 10,
        page: 1,
      },
    };

    const filters: any = {};

    if (context.propsValue.number_of_followers) {
      filters.number_of_followers = context.propsValue.number_of_followers;
    }

    if (context.propsValue.engagement_percent) {
      filters.engagement_percent = context.propsValue.engagement_percent;
    }

    if (
      context.propsValue.is_verified !== undefined &&
      context.propsValue.is_verified !== null
    ) {
      filters.is_verified = context.propsValue.is_verified;
    }

    if (
      context.propsValue.exclude_private_profile !== undefined &&
      context.propsValue.exclude_private_profile !== null
    ) {
      filters.exclude_private_profile =
        context.propsValue.exclude_private_profile;
    }

    body.filters = filters;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/discovery/creators/similar/',
      body
    );

    return response;
  },
});
