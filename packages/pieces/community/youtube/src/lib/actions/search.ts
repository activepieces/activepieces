import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';

export const youtubeSearchAction = createAction({
  auth: youtubeAuth,
  name: 'search',
  classification: 'SEARCH',
  displayName: 'Search',
  description:
    'Search YouTube videos, channels, and playlists using the YouTube Data API search.list endpoint.',
  audience: 'both',
  aiMetadata: { description: 'Runs a YouTube search.list query across videos, channels, and playlists at once or restricted to a single resource type, and can instead be scoped to uploads owned by the authenticated account (For Mine), a CMS content owner, or the developer project. Use it to turn a free-text query, channel, date range, region, or topic into video, channel, or playlist IDs for later steps; prefer List Playlist Items when the playlist ID is already known. Video-only filters such as duration, definition, caption, event type, and location require Type to be Video, and Location must be paired with Location Radius. Read-only and idempotent.', idempotent: true },
  // The groups hold the ESSENTIAL form and nothing else, deliberately.
  // property-ui-selection.md section 4: "Only ungrouped props honour
  // `advanced: true` - members of `tabs` and `section` groups are always
  // essential; the flag is ignored on them." So a prop cannot be both grouped
  // and advanced: putting an advanced prop in a section would silently promote
  // it back into the first-run form. `section` is also the only display that
  // keeps an Advanced section at all - one `builder` or `footer` group would
  // disable it form-wide and neutralise every flag.
  propertyGroups: [
    {
      key: 'search',
      display: 'section',
      label: 'Search',
      icon: 'text',
      description: 'What to look for, and what kind of result to return.',
      props: ['query', 'type', 'order'],
    },
    {
      key: 'results',
      display: 'section',
      label: 'Results',
      icon: 'sliders',
      description: 'How many results to return and how strictly to filter them.',
      props: ['maxResults', 'safeSearch'],
    },
    {
      key: 'published',
      display: 'section',
      label: 'Published',
      icon: 'calendar',
      description: 'Restrict results to a publication time window.',
      props: ['publishedAfter', 'publishedBefore'],
    },
  ],
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description:
        'Search term. Supports operators like OR (`|`) and NOT (`-`) as supported by YouTube search.',
      required: false,
      placeholder: 'activepieces tutorial | automation -shorts',
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description:
        'Restrict results to a resource type. Use "Any" to search videos, channels, and playlists.',
      required: false,
      width: 'half',
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
      advanced: true,
    }),
    forDeveloper: Property.Checkbox({
      displayName: 'For Developer',
      description:
        'Restrict results to videos uploaded via your developer project.',
      required: false,
      advanced: true,
    }),
    forMine: Property.Checkbox({
      displayName: 'For Mine',
      description:
        'Restrict results to videos owned by the authenticated user.',
      required: false,
      advanced: true,
    }),
    onBehalfOfContentOwner: Property.ShortText({
      displayName: 'On Behalf Of Content Owner',
      description:
        'Required when For Content Owner is enabled. Intended for YouTube CMS content partners.',
      required: false,
      advanced: true,
      placeholder: 'YouTube CMS content owner ID',
    }),
    channelId: Property.ShortText({
      displayName: 'Channel ID',
      description: 'Only return resources from this channel.',
      required: false,
      advanced: true,
      placeholder: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    }),
    channelType: Property.StaticDropdown({
      displayName: 'Channel Type',
      description: 'Restrict channel searches to a specific channel type.',
      required: false,
      advanced: true,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'Show', value: 'show' },
        ],
      },
    }),
    order: Property.StaticDropdown({
      displayName: 'Order',
      description:
        'How to sort results. Relevance is the YouTube ranking; Date returns newest first, which is what most latest-video automations want.',
      required: false,
      width: 'half',
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
      description:
        'Whether to exclude restricted content. Moderate follows local community standards, Strict removes all restricted results, None applies no filter.',
      required: false,
      width: 'half',
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
      description:
        'Only include resources created at or after this datetime (RFC 3339).',
      required: false,
      width: 'half',
    }),
    publishedBefore: Property.DateTime({
      displayName: 'Published Before',
      description:
        'Only include resources created before or at this datetime (RFC 3339).',
      required: false,
      width: 'half',
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Acceptable values are 0 to 50. Defaults to 25.',
      required: false,
      width: 'half',
      defaultValue: 25,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description:
        'Fetch a specific page of results using the nextPageToken from a previous run.',
      required: false,
      advanced: true,
      placeholder: 'CAUQAA',
    }),
    regionCode: Property.ShortText({
      displayName: 'Region Code',
      description: 'ISO 3166-1 alpha-2 country code (for example: US, DE, JP).',
      required: false,
      advanced: true,
      placeholder: 'US',
    }),
    relevanceLanguage: Property.ShortText({
      displayName: 'Relevance Language',
      description:
        'ISO 639-1 language code (for example: en, es, ja, zh-Hans).',
      required: false,
      advanced: true,
      placeholder: 'en',
    }),
    topicId: Property.ShortText({
      displayName: 'Topic ID',
      description:
        'Curated Freebase topic ID to restrict results by topic (for example: /m/04rlf for Music).',
      required: false,
      advanced: true,
      placeholder: '/m/04rlf',
    }),
    eventType: Property.StaticDropdown({
      displayName: 'Event Type (video only)',
      description:
        'Restrict results to live broadcasts by state: Completed (already ended), Live (in progress), or Upcoming (scheduled).',
      required: false,
      advanced: true,
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
      advanced: true,
      placeholder: '37.42307,-122.08427',
    }),
    locationRadius: Property.ShortText({
      displayName: 'Location Radius (video only)',
      description:
        'Distance from Location with unit (m, km, ft, mi), for example: 5km. Requires Location.',
      required: false,
      advanced: true,
      placeholder: '5km',
    }),
    videoCategoryId: Property.ShortText({
      displayName: 'Video Category ID (video only)',
      description:
        'Restrict results to a single video category, by its numeric ID.',
      required: false,
      advanced: true,
      placeholder: '10',
    }),
    videoDuration: Property.StaticDropdown({
      displayName: 'Video Duration (video only)',
      description:
        'Restrict results by length: Short is under 4 minutes, Medium 4-20 minutes, Long over 20 minutes.',
      required: false,
      advanced: true,
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
      description:
        'Restrict results to high-definition (720p or better) or standard-definition videos.',
      required: false,
      advanced: true,
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
      description: 'Restrict results to 2D or 3D videos.',
      required: false,
      advanced: true,
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
      description:
        'Set to True to return only videos that can be embedded in a web page.',
      required: false,
      advanced: true,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'True', value: 'true' },
        ],
      },
    }),
    videoLicense: Property.StaticDropdown({
      displayName: 'Video License (video only)',
      description:
        'Restrict results by licence. Creative Commons videos may be reused with attribution; YouTube is the standard licence.',
      required: false,
      advanced: true,
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
      description:
        'Set to True to return only videos whose creator declared a paid promotion.',
      required: false,
      advanced: true,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'True', value: 'true' },
        ],
      },
    }),
    videoSyndicated: Property.StaticDropdown({
      displayName: 'Video Syndicated (video only)',
      description:
        'Set to True to return only videos that can be played outside youtube.com.',
      required: false,
      advanced: true,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'True', value: 'true' },
        ],
      },
    }),
    videoType: Property.StaticDropdown({
      displayName: 'Video Type (video only)',
      description: 'Restrict results to episodes of a show or to full movies.',
      required: false,
      advanced: true,
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
      description:
        'Restrict results by caption availability. Closed Caption returns only captioned videos; None returns only uncaptioned ones.',
      required: false,
      advanced: true,
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

    const chosenType =
      type === 'any' || !type ? 'video,channel,playlist' : type;

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
      throw new Error('Video-only filters require Type to be set to "Video".');
    }

    if ((location && !locationRadius) || (!location && locationRadius)) {
      throw new Error(
        'Location and Location Radius must be provided together.'
      );
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
        throw new Error(
          'For Content Owner requires Type to be set to "Video".'
        );
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

    const accessToken = context.auth.access_token;

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
