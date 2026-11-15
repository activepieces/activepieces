import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { listSubscriptionsOutputSchema } from '../output-schemas';
import { youtubeClient } from '../common/client';

export const youtubeListMySubscriptionsAction = createAction({
  auth: youtubeAuth,
  outputSchema: listSubscriptionsOutputSchema,
  name: 'list_my_subscriptions',
  classification: 'SEARCH',
  displayName: 'List My Subscriptions',
  description: 'List the channels the connected account is subscribed to.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the channels the authenticated account subscribes to via subscriptions.list, returning each subscribed channel title and ID. Use it to answer "who do I follow" or to feed channel IDs into List Channel Videos. Set For Channel ID to check whether one specific channel is subscribed. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    order: Property.StaticDropdown({
      displayName: 'Order',
      description: 'Ordering of the subscriptions.',
      required: false,
      options: {
        options: [
          { label: 'Alphabetical', value: 'alphabetical' },
          { label: 'Relevance', value: 'relevance' },
          { label: 'Unread', value: 'unread' },
        ],
      },
    }),
    forChannelId: Property.ShortText({
      displayName: 'For Channel ID',
      description:
        'Only return the subscription to this channel, if one exists. Returns an empty list otherwise.',
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Number of subscriptions to return (0-50, default 25).',
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
    const { order, forChannelId, maxResults, pageToken } = context.propsValue;

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
      mine: 'true',
      maxResults: String(Math.trunc(Number(maxResults ?? 25))),
    };

    if (order) {
      queryParams['order'] = order;
    }
    if (forChannelId) {
      queryParams['forChannelId'] = forChannelId;
    }
    if (pageToken) {
      queryParams['pageToken'] = pageToken;
    }

    return youtubeClient.sendRequest({
      accessToken,
      method: HttpMethod.GET,
      path: '/subscriptions',
      operation: 'List My Subscriptions',
      queryParams,
    });
  },
});
