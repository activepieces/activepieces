import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { youtubeAuth } from '../../';

export const youtubeSearchAction = createAction({
  auth: youtubeAuth,
  name: 'search',
  displayName: 'Search',
  description:
    'Search YouTube videos, channels, and playlists using the YouTube Data API search.list endpoint.',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description:
        'Search term. Supports operators like OR (`|`) and NOT (`-`) as supported by YouTube search.',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description:
        'Restrict results to a resource type. Use "Any" to search videos, channels, and playlists.',
      required: false,
      defaultValue: 'any',
      options: {
        options: [
          { label: 'Any (video, channel, playlist)', value: 'any' },
          { label: 'Video', value: 'video' },
          { label: 'Channel', value: 'channel' },
          { label: 'Playlist', value: 'playlist' },
        ],
      },
    }),
    forContentOwner: Property.Checkbox({
      displayName: 'For Content Owner',
      description:
        'Restrict results to videos owned by the content owner set in On Behalf Of Content Owner.',
      required: false,
    }),
    forDeveloper: Property.Checkbox({
      displayName: 'For Developer',
      description: 'Restrict results to videos uploaded via your developer project.',
      required: false,
    }),
    forMine: Property.Checkbox({
      displayName: 'For Mine',
      description: 'Restrict results to videos owned by the authenticated user.',
      required: false,
    }),
    onBehalfOfContentOwner: Property.ShortText({
      displayName: 'On Behalf Of Content Owner',
      description:
        'Required when For Content Owner is enabled. Intended for YouTube CMS content partners.',
      required: false,
    }),
    channelId: Property.ShortText({
      displayName: 'Channel ID',
      description: 'Only return resources from this channel.',
      required: false,
    }),
    channelType: Property.StaticDropdown({
      displayName: 'Channel Type',
      description: 'Restrict channel searches to a specific channel type.',
      required: false,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'Show', value: 'show' },
        ],
      },
    }),
    order: Property.StaticDropdown({
      displayName: 'Order',
      required: false,
      defaultValue: 'relevance',
      options: {
        options: [
          { label: 'Relevance', value: 'relevance' },
          { label: 'Date', value: 'date' },
          { label: 'Rating', value: 'rating' },
          { label: 'Title', value: 'title' },
          { label: 'Video Count', value: 'videoCount' },
          { label: 'View Count', value: 'viewCount' },
        ],
      },
    }),
    safeSearch: Property.StaticDropdown({
      displayName: 'Safe Search',
      required: false,
      defaultValue: 'moderate',
      options: {
        options: [
          { label: 'Moderate', value: 'moderate' },
          { label: 'None', value: 'none' },
          { label: 'Strict', value: 'strict' },
        ],
      },
    }),
    publishedAfter: Property.DateTime({
      displayName: 'Published After',
      description: 'Only include resources created at or after this datetime (RFC 3339).',
      required: false,
    }),
    publishedBefore: Property.DateTime({
      displayName: 'Published Before',
      description: 'Only include resources created before or at this datetime (RFC 3339).',
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Acceptable values are 0 to 50. Defaults to 25.',
      required: false,
      defaultValue: 25,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      required: false,
    }),
    regionCode: Property.ShortText({
      displayName: 'Region Code',
      description: 'ISO 3166-1 alpha-2 country code (for example: US, DE, JP).',
      required: false,
    }),
    relevanceLanguage: Property.ShortText({
      displayName: 'Relevance Language',
      description: 'ISO 639-1 language code (for example: en, es, ja, zh-Hans).',
      required: false,
    }),
    topicId: Property.ShortText({
      displayName: 'Topic ID',
      description:
        'Curated Freebase topic ID to restrict results by topic (for example: /m/04rlf for Music).',
      required: false,
    }),
    eventType: Property.StaticDropdown({
      displayName: 'Event Type (video only)',
      required: false,
      options: {
        options: [
          { label: 'Completed', value: 'completed' },
          { label: 'Live', value: 'live' },
          { label: 'Upcoming', value: 'upcoming' },
        ],
      },
    }),
    location: Property.ShortText({
      displayName: 'Location (video only)',
      description:
        'Latitude,longitude center point (for example: 37.42307,-122.08427). Requires Location Radius.',
      required: false,
    }),
    locationRadius: Property.ShortText({
      displayName: 'Location Radius (video only)',
      description:
        'Distance from Location with unit (m, km, ft, mi), for example: 5km. Requires Location.',
      required: false,
    }),
    videoCategoryId: Property.ShortText({
      displayName: 'Video Category ID (video only)',
      required: false,
    }),
    videoDuration: Property.StaticDropdown({
      displayName: 'Video Duration (video only)',
      required: false,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'Short (<4 min)', value: 'short' },
          { label: 'Medium (4-20 min)', value: 'medium' },
          { label: 'Long (>20 min)', value: 'long' },
        ],
      },
    }),
    videoDefinition: Property.StaticDropdown({
      displayName: 'Video Definition (video only)',
      required: false,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'High Definition', value: 'high' },
          { label: 'Standard Definition', value: 'standard' },
        ],
      },
    }),
    videoDimension: Property.StaticDropdown({
      displayName: 'Video Dimension (video only)',
      required: false,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: '2D', value: '2d' },
          { label: '3D', value: '3d' },
        ],
      },
    }),
    videoEmbeddable: Property.StaticDropdown({
      displayName: 'Video Embeddable (video only)',
      required: false,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'True', value: 'true' },
        ],
      },
    }),
    videoLicense: Property.StaticDropdown({
      displayName: 'Video License (video only)',
      required: false,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'Creative Commons', value: 'creativeCommon' },
          { label: 'YouTube', value: 'youtube' },
        ],
      },
    }),
    videoPaidProductPlacement: Property.StaticDropdown({
      displayName: 'Video Paid Product Placement (video only)',
      required: false,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'True', value: 'true' },
        ],
      },
    }),
    videoSyndicated: Property.StaticDropdown({
      displayName: 'Video Syndicated (video only)',
      required: false,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'True', value: 'true' },
        ],
      },
    }),
    videoType: Property.StaticDropdown({
      displayName: 'Video Type (video only)',
      required: false,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'Episode', value: 'episode' },
          { label: 'Movie', value: 'movie' },
        ],
      },
    }),
    videoCaption: Property.StaticDropdown({
      displayName: 'Video Caption (video only)',
      required: false,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'Closed Caption', value: 'closedCaption' },
          { label: 'None', value: 'none' },
        ],
      },
    }),
  },
  async run(context) {
    const {
      channelId,
      channelType,
      eventType,
      forContentOwner,
      forDeveloper,
      forMine,
      location,
      locationRadius,
      maxResults,
      onBehalfOfContentOwner,
      order,
      pageToken,
      publishedAfter,
      publishedBefore,
      query,
      regionCode,
      relevanceLanguage,
      safeSearch,
      topicId,
      type,
      videoCaption,
      videoCategoryId,
      videoDefinition,
      videoDimension,
      videoDuration,
      videoEmbeddable,
      videoLicense,
      videoPaidProductPlacement,
      videoSyndicated,
      videoType,
    } = context.propsValue;

    const chosenType = type === 'any' || !type ? 'video,channel,playlist' : type;

    const hasVideoOnlyFilter = Boolean(
      eventType ||
        location ||
        locationRadius ||
        videoCaption ||
        videoCategoryId ||
        videoDefinition ||
        videoDimension ||
        videoDuration ||
        videoEmbeddable ||
        videoLicense ||
        videoPaidProductPlacement ||
        videoSyndicated ||
        videoType
    );

    if (hasVideoOnlyFilter && chosenType !== 'video') {
      throw new Error(
        'Video-only filters require Type to be set to "Video".'
      );
    }

    if ((location && !locationRadius) || (!location && locationRadius)) {
      throw new Error('Location and Location Radius must be provided together.');
    }

    const ownershipFilters = [forContentOwner, forDeveloper, forMine].filter(
      (value) => value
    ).length;

    if (ownershipFilters > 1) {
      throw new Error(
        'Only one of For Content Owner, For Developer, or For Mine can be enabled.'
      );
    }

    if (forContentOwner) {
      if (chosenType !== 'video') {
        throw new Error('For Content Owner requires Type to be set to "Video".');
      }
      if (!onBehalfOfContentOwner) {
        throw new Error(
          'On Behalf Of Content Owner is required when For Content Owner is enabled.'
        );
      }
    }

    if (forMine && chosenType !== 'video') {
      throw new Error('For Mine requires Type to be set to "Video".');
    }

    const restrictedWhenOwnedSearch = Boolean(
      videoDefinition ||
        videoDimension ||
        videoDuration ||
        videoEmbeddable ||
        videoLicense ||
        videoPaidProductPlacement ||
        videoSyndicated ||
        videoType
    );

    if ((forContentOwner || forMine) && restrictedWhenOwnedSearch) {
      throw new Error(
        'For Content Owner and For Mine cannot be combined with Video Definition, Video Dimension, Video Duration, Video Embeddable, Video License, Video Paid Product Placement, Video Syndicated, or Video Type.'
      );
    }

    if (maxResults !== undefined && maxResults !== null) {
      const maxResultsNumber = Math.trunc(Number(maxResults));
      if (maxResultsNumber < 0 || maxResultsNumber > 50) {
        throw new Error('Max Results must be between 0 and 50.');
      }
    }

    const accessToken = (context.auth as OAuth2PropertyValue).access_token;

    const queryParams: Record<string, string> = {
      part: 'snippet',
      type: chosenType,
    };

    if (query) queryParams['q'] = query;
    if (forContentOwner) queryParams['forContentOwner'] = 'true';
    if (forDeveloper) queryParams['forDeveloper'] = 'true';
    if (forMine) queryParams['forMine'] = 'true';
    if (onBehalfOfContentOwner) {
      queryParams['onBehalfOfContentOwner'] = onBehalfOfContentOwner;
    }
    if (channelId) queryParams['channelId'] = channelId;
    if (channelType) queryParams['channelType'] = channelType;
    if (order) queryParams['order'] = order;
    if (safeSearch) queryParams['safeSearch'] = safeSearch;
    if (publishedAfter) queryParams['publishedAfter'] = publishedAfter;
    if (publishedBefore) queryParams['publishedBefore'] = publishedBefore;
    if (pageToken) queryParams['pageToken'] = pageToken;
    if (regionCode) queryParams['regionCode'] = regionCode;
    if (topicId) queryParams['topicId'] = topicId;
    if (relevanceLanguage) {
      queryParams['relevanceLanguage'] = relevanceLanguage;
    }
    if (eventType) queryParams['eventType'] = eventType;
    if (location) queryParams['location'] = location;
    if (locationRadius) queryParams['locationRadius'] = locationRadius;
    if (videoCategoryId) queryParams['videoCategoryId'] = videoCategoryId;
    if (videoDuration) queryParams['videoDuration'] = videoDuration;
    if (videoDefinition) queryParams['videoDefinition'] = videoDefinition;
    if (videoDimension) queryParams['videoDimension'] = videoDimension;
    if (videoEmbeddable) queryParams['videoEmbeddable'] = videoEmbeddable;
    if (videoLicense) queryParams['videoLicense'] = videoLicense;
    if (videoPaidProductPlacement) {
      queryParams['videoPaidProductPlacement'] = videoPaidProductPlacement;
    }
    if (videoSyndicated) queryParams['videoSyndicated'] = videoSyndicated;
    if (videoType) queryParams['videoType'] = videoType;
    if (videoCaption) queryParams['videoCaption'] = videoCaption;
    if (maxResults !== undefined && maxResults !== null) {
      queryParams['maxResults'] = String(Math.trunc(Number(maxResults)));
    }

    const response = await httpClient.sendRequest<YoutubeSearchListResponse>({
      method: HttpMethod.GET,
      url: 'https://www.googleapis.com/youtube/v3/search',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      queryParams,
    });

    return response.body;
  },
});

type YoutubeSearchListResponse = {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  regionCode?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YoutubeSearchResult[];
};

type YoutubeSearchResult = {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId?: string;
    channelId?: string;
    playlistId?: string;
  };
  snippet?: {
    publishedAt?: string;
    channelId?: string;
    title?: string;
    description?: string;
    channelTitle?: string;
    liveBroadcastContent?: string;
    publishTime?: string;
  };
};