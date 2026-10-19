import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { searchOutputSchema } from '../output-schemas';

export const youtubeSearchAction = createAction({
  auth: youtubeAuth,

  outputSchema: searchOutputSchema,
  name: 'search',
  classification: 'SEARCH',
  displayName: 'Search',
  description: 'Search YouTube for videos, channels or playlists.',
  audience: 'human',
  aiMetadata: { description: 'Runs a YouTube search.list query across videos, channels, and playlists at once or restricted to a single resource type, and can instead be scoped to uploads owned by the authenticated account (For Mine), a CMS content owner, or the developer project. Use it to turn a free-text query, channel, date range, region, or topic into video, channel, or playlist IDs for later steps; prefer List Playlist Items when the playlist ID is already known. Video-only filters such as duration, definition, caption, event type, and location require Type to be Video, and Location must be paired with Location Radius. Read-only and idempotent.', idempotent: true },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description:
        'Words to search for. Use | for OR and - to leave a word out.',
      placeholder: 'cooking tutorial',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description:
        'Which kind of result to return. Video-only filters need Video.',
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
        'Only videos of the owner set in On Behalf Of Content Owner.',
      required: false,
      advanced: true,
    }),
    forDeveloper: Property.Checkbox({
      displayName: 'For Developer',
      description:
        "Only videos uploaded through this connection's Google Cloud app.",
      required: false,
      advanced: true,
    }),
    forMine: Property.Checkbox({
      displayName: 'For Mine',
      description:
        'Only videos on the connected account. Needs Type set to Video.',
      required: false,
      advanced: true,
    }),
    onBehalfOfContentOwner: Property.ShortText({
      displayName: 'On Behalf Of Content Owner',
      description:
        'Content owner ID, for YouTube partners who manage many channels.',
      required: false,
      advanced: true,
    }),
    channelId: Property.ShortText({
      displayName: 'Channel ID',
      description:
        'Only return results from this channel. The ID starts with UC.',
      placeholder: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
      required: false,
    }),
    channelType: Property.StaticDropdown({
      displayName: 'Channel Type',
      description: 'Show returns only channels that publish TV shows.',
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
      description: 'Whether to leave out restricted content.',
      required: false,
      advanced: true,
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
      description: 'Only results published on or after this date.',
      required: false,
    }),
    publishedBefore: Property.DateTime({
      displayName: 'Published Before',
      description: 'Only results published before this date.',
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'How many results to return, up to 50.',
      required: false,
      defaultValue: 25,
      display: 'stepper',
      min: 0,
      max: 50,
      step: 1,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description:
        'The nextPageToken from an earlier run, to get the next page.',
      required: false,
      advanced: true,
    }),
    regionCode: Property.ShortText({
      displayName: 'Region Code',
      description:
        'Two-letter country code. Results must be viewable there.',
      placeholder: 'US',
      required: false,
      advanced: true,
    }),
    relevanceLanguage: Property.ShortText({
      displayName: 'Relevance Language',
      description:
        'Two-letter language code. Results in it rank higher.',
      placeholder: 'en',
      required: false,
      advanced: true,
    }),
    topicId: Property.ShortText({
      displayName: 'Topic ID',
      description: 'Freebase topic ID to limit results to one topic.',
      placeholder: '/m/04rlf',
      required: false,
      advanced: true,
    }),
    eventType: Property.StaticDropdown({
      displayName: 'Event Type',
      description:
        'Video only. Limit to live, upcoming or finished broadcasts.',
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
      displayName: 'Location',
      description:
        'Video only. Latitude,longitude. Needs Location Radius too.',
      placeholder: '37.42307,-122.08427',
      required: false,
      advanced: true,
    }),
    locationRadius: Property.ShortText({
      displayName: 'Location Radius',
      description:
        'Video only. Distance from Location in m, km, ft or mi.',
      placeholder: '5km',
      required: false,
      advanced: true,
    }),
    videoCategoryId: Property.ShortText({
      displayName: 'Video Category ID',
      description:
        "Video only. YouTube's numeric category ID, like 10 for Music.",
      placeholder: '10',
      required: false,
      advanced: true,
    }),
    videoDuration: Property.StaticDropdown({
      displayName: 'Video Duration',
      description: 'Video only.',
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
      displayName: 'Video Definition',
      description: 'Video only.',
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
      displayName: 'Video Dimension',
      description: 'Video only.',
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
      displayName: 'Video Embeddable',
      description: 'Video only. True: only videos other sites can embed.',
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
      displayName: 'Video License',
      description: 'Video only.',
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
      displayName: 'Video Paid Product Placement',
      description: 'Video only. True: only videos with paid promotions.',
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
      displayName: 'Video Syndicated',
      description:
        'Video only. True: only videos that play outside youtube.com.',
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
      displayName: 'Video Type',
      description: 'Video only.',
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
      displayName: 'Video Caption',
      description: 'Video only.',
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
      if (!Number.isFinite(maxResultsNumber) || maxResultsNumber < 0 || maxResultsNumber > 50) {
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
