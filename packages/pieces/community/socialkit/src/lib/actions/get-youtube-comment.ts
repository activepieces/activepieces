import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client'; 
import { SocialKitAuth } from '../common/auth';

export const getYoutubeComment = createAction({
  auth: SocialKitAuth,
  name: 'getYoutubeComment',
  displayName: 'Get YouTube Comments',
  description: 'Fetch YouTube video comments with author, likes, replies, and engagement details.',

  props: {
    url: Property.ShortText({
      displayName: 'YouTube Video URL',
      description: 'Enter the YouTube video URL ',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of comments to retrieve (default 10, max 100).',
      required: false,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort comments by top (most popular) or new (most recent).',
      required: false,
      options: {
        options: [
          { label: 'Top (Most Popular)', value: 'top' },
          { label: 'New (Most Recent)', value: 'new' },
        ],
      },
      defaultValue: 'new',
    }),
  },

  async run({ auth, propsValue }) {
    const { url, limit, sortBy } = propsValue;

    const queryParams = new URLSearchParams({
      url,
      ...(limit ? { limit: limit.toString() } : {}),
      ...(sortBy ? { sortBy } : {}),
    });

 
    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/youtube/comments?${queryParams.toString()}`
    );

  
    return response;
  },
});
