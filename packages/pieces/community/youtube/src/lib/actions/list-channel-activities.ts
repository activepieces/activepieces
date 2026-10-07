import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { listChannelActivitiesOutputSchema } from '../output-schemas';
import { youtubeClient } from '../common/client';

export const youtubeListChannelActivitiesAction = createAction({
  auth: youtubeAuth,
  outputSchema: listChannelActivitiesOutputSchema,
  name: 'list_channel_activities',
  classification: 'SEARCH',
  displayName: 'List Channel Activities',
  description:
    'List recent activity events on a channel, such as uploads and playlist additions.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists recent activity events (uploads, playlist additions and similar) for a channel via activities.list, optionally bounded by a published date range. Use List Channel Videos when only uploads are wanted; this returns the mixed activity feed. Provide a channel ID, or leave it blank to read the authenticated account own activity. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    channelId: Property.ShortText({
      displayName: 'Channel ID',
      description:
        'Channel ID starting with `UC`. Leave blank to list the authenticated account own activity.',
      required: false,
    }),
    publishedAfter: Property.DateTime({
      displayName: 'Published After',
      description:
        'Only include activities created at or after this datetime (RFC 3339).',
      required: false,
    }),
    publishedBefore: Property.DateTime({
      displayName: 'Published Before',
      description:
        'Only include activities created before this datetime (RFC 3339).',
      required: false,
    }),
    regionCode: Property.ShortText({
      displayName: 'Region Code',
      description: 'ISO 3166-1 alpha-2 country code (for example: US, DE, JP).',
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Number of activities to return (0-50, default 25).',
      required: false,
      defaultValue: 25,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'Token from a previous response, to fetch the next page.',
      required: false,
    }),
  },
  async run(context) {
    const accessToken = context.auth.access_token;
    const {
      channelId,
      publishedAfter,
      publishedBefore,
      regionCode,
      maxResults,
      pageToken,
    } = context.propsValue;

    if (maxResults !== undefined && maxResults !== null) {
      const maxResultsNumber = Math.trunc(Number(maxResults));
      if (
        !Number.isFinite(maxResultsNumber) ||
        maxResultsNumber < 0 ||
        maxResultsNumber > 50
      ) {
        throw new Error('Max Results must be between 0 and 50.');
      }
    }

    const queryParams: Record<string, string> = {
      part: 'snippet,contentDetails',
      maxResults: String(Math.trunc(Number(maxResults ?? 25))),
    };

    if (channelId) {
      queryParams['channelId'] = channelId;
    } else {
      queryParams['mine'] = 'true';
    }
    if (publishedAfter) {
      queryParams['publishedAfter'] = publishedAfter;
    }
    if (publishedBefore) {
      queryParams['publishedBefore'] = publishedBefore;
    }
    if (regionCode) {
      queryParams['regionCode'] = regionCode;
    }
    if (pageToken) {
      queryParams['pageToken'] = pageToken;
    }

    return youtubeClient.sendRequest({
      accessToken,
      method: HttpMethod.GET,
      path: '/activities',
      operation: 'List Channel Activities',
      queryParams,
    });
  },
});
