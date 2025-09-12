import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { ForeplayAuth } from '../common/auth';

export const getAdsByPage = createAction({
  auth: ForeplayAuth,
  name: 'getAdsByPage',
  displayName: 'Get Ads by Page',
  description: 'Retrieve all ads for a specific Facebook page ID with filters and pagination.',
  props: {
    pageId: Property.ShortText({
      displayName: 'page ID',
      description: 'Facebook page ID to search for. This should be the numeric ID of the Facebook page.',
      required: true,
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: "Start date (inclusive), format 'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM:SS'",
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: "End date (inclusive), format 'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM:SS'",
      required: false,
    }),
    order: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Sort ads by creation date or duration',
      required: false,
      options: {
        options: [
          { label: 'Newest', value: 'newest' },
          { label: 'Oldest', value: 'oldest' },
          { label: 'Longest Running', value: 'longest_running' },
          { label: 'Most Relevant', value: 'most_relevant' },
        ],
      },
      defaultValue: 'newest',
    }),
    live: Property.StaticDropdown({
      displayName: 'Live Status',
      description: 'Filter active vs inactive ads',
      required: false,
      options: {
        options: [
          { label: 'All', value: '' },
          { label: 'Live Ads', value: 'true' },
          { label: 'Inactive Ads', value: 'false' },
        ],
      },
    }),
    display_format: Property.StaticMultiSelectDropdown({
      displayName: 'Display Format',
      description: 'Filter by display format',
      required: false,
      options: {
        options: [
          { label: 'Video', value: 'video' },
          { label: 'Carousel', value: 'carousel' },
          { label: 'Image', value: 'image' },
          { label: 'DCO', value: 'dco' },
          { label: 'DPA', value: 'dpa' },
          { label: 'Multi Images', value: 'multi_images' },
          { label: 'Multi Videos', value: 'multi_videos' },
          { label: 'Multi Medias', value: 'multi_medias' },
          { label: 'Event', value: 'event' },
          { label: 'Text', value: 'text' },
        ],
      },
    }),
    publisher_platform: Property.StaticMultiSelectDropdown({
      displayName: 'Publisher Platform',
      description: 'Filter by publisher platforms',
      required: false,
      options: {
        options: [
          { label: 'Facebook', value: 'facebook' },
          { label: 'Instagram', value: 'instagram' },
          { label: 'Audience Network', value: 'audience_network' },
          { label: 'Messenger', value: 'messenger' },
          { label: 'TikTok', value: 'tiktok' },
          { label: 'YouTube', value: 'youtube' },
          { label: 'LinkedIn', value: 'linkedin' },
          { label: 'Threads', value: 'threads' },
        ],
      },
    }),
    niches: Property.StaticMultiSelectDropdown({
      displayName: 'Niches',
      description: 'Filter by niches',
      required: false,
      options: {
        options: [
          { label: 'Travel', value: 'travel' },
          { label: 'Food', value: 'food' },
          { label: 'Fashion', value: 'fashion' },
          { label: 'Beauty', value: 'beauty' },
          { label: 'Health', value: 'health' },
          { label: 'Technology', value: 'technology' },
          { label: 'Automotive', value: 'automotive' },
          { label: 'Finance', value: 'finance' },
          { label: 'Education', value: 'education' },
          { label: 'Entertainment', value: 'entertainment' },
          { label: 'Sports', value: 'sports' },
          { label: 'Home', value: 'home' },
          { label: 'Pets', value: 'pets' },
          { label: 'Business', value: 'business' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    market_target: Property.StaticDropdown({
      displayName: 'Market Target',
      description: 'Filter by market target',
      required: false,
      options: {
        options: [
          { label: 'B2B', value: 'b2b' },
          { label: 'B2C', value: 'b2c' },
        ],
      },
    }),
    languages: Property.StaticMultiSelectDropdown({
      displayName: 'Languages',
      description: 'Filter ads by languages',
      required: false,
      options: {
        options: [
          { label: 'English', value: 'en' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Italian', value: 'it' },
          { label: 'Dutch/Flemish', value: 'nl' },
          { label: 'Romanian', value: 'ro' },
        ],
      },
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor for pagination (from previous response)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of ads per request (max 250)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      pageId,
      start_date,
      end_date,
      order,
      live,
      display_format,
      publisher_platform,
      niches,
      market_target,
      languages,
      cursor,
      limit,
    } = propsValue;

    if (!pageId) {
      throw new Error('Facebook Page ID is required');
    }

    const queryParams = new URLSearchParams();
    queryParams.append('page_id', pageId);

    if (start_date) queryParams.append('start_date', start_date);
    if (end_date) queryParams.append('end_date', end_date);
    if (order) queryParams.append('order', order);
    if (live) queryParams.append('live', live);
    display_format?.forEach((df: string) => queryParams.append('display_format', df));
    publisher_platform?.forEach((pp: string) => queryParams.append('publisher_platform', pp));
    niches?.forEach((n: string) => queryParams.append('niches', n));
    if (market_target) queryParams.append('market_target', market_target);
    languages?.forEach((lang: string) => queryParams.append('languages', lang));
    if (cursor) queryParams.append('cursor', cursor);
    if (limit) queryParams.append('limit', limit.toString());

    const response = await makeRequest(
      auth,
      HttpMethod.GET,
      `/brand/getAdsByPageId?${queryParams.toString()}`
    );

    return response;
  },
});
