import { createAction, Property } from '@activepieces/pieces-framework';
import { supadataAuth } from '../auth';
import { supadataClient } from '../common/client';
import { supadataSearchYoutubeOutputSchema } from '../output-schemas';

export const searchYoutubeAction = createAction({
  name: 'supadata_search_youtube',
  outputSchema: supadataSearchYoutubeOutputSchema,
  displayName: 'Search YouTube',
  description: 'Searches YouTube for videos, channels and playlists.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Searches YouTube for videos, channels, playlists or movies with optional filters. Without Limit it returns one page plus a nextPageToken; pass that token back as Next Page Token to continue (other filters are then ignored). Read-only.',
    idempotent: true,
  },
  auth: supadataAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Search text.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Filter by content type.',
      required: false,
      options: { disabled: false, options: [{ label: 'all', value: 'all' }, { label: 'video', value: 'video' }, { label: 'channel', value: 'channel' }, { label: 'playlist', value: 'playlist' }, { label: 'movie', value: 'movie' }] },
    }),
    uploadDate: Property.StaticDropdown({
      displayName: 'Upload Date',
      description: 'Filter by upload date (videos and movies only).',
      required: false,
      options: { disabled: false, options: [{ label: 'all', value: 'all' }, { label: 'hour', value: 'hour' }, { label: 'today', value: 'today' }, { label: 'week', value: 'week' }, { label: 'month', value: 'month' }, { label: 'year', value: 'year' }] },
    }),
    duration: Property.StaticDropdown({
      displayName: 'Duration',
      description: 'short is under 4 minutes, medium 4-20 minutes, long over 20 minutes (videos and movies only).',
      required: false,
      options: { disabled: false, options: [{ label: 'all', value: 'all' }, { label: 'short', value: 'short' }, { label: 'medium', value: 'medium' }, { label: 'long', value: 'long' }] },
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort order of results.',
      required: false,
      options: { disabled: false, options: [{ label: 'relevance', value: 'relevance' }, { label: 'rating', value: 'rating' }, { label: 'date', value: 'date' }, { label: 'views', value: 'views' }] },
    }),
    features: Property.StaticMultiSelectDropdown({
      displayName: 'Features',
      description: 'Special features to filter by (videos and movies only).',
      required: false,
      options: { options: [{ label: 'hd', value: 'hd' }, { label: 'subtitles', value: 'subtitles' }, { label: 'creative-commons', value: 'creative-commons' }, { label: '3d', value: '3d' }, { label: 'live', value: 'live' }, { label: '4k', value: '4k' }, { label: '360', value: '360' }, { label: 'location', value: 'location' }, { label: 'hdr', value: 'hdr' }, { label: 'vr180', value: 'vr180' }] },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results; the API paginates automatically up to this many.',
      required: false,
    }),
    nextPageToken: Property.ShortText({
      displayName: 'Next Page Token',
      description: 'Token from a previous search to fetch the next page.',
      required: false,
    }),
  },
  async run(context) {
    const { query, type, uploadDate, duration, sortBy, features, limit, nextPageToken } = context.propsValue;
    return supadataClient.request({
      apiKey: context.auth.secret_text,
      method: supadataClient.GET,
      path: '/youtube/search',
      query: { query, type, uploadDate, duration, sortBy, features, limit, nextPageToken },
    });
  },
});
