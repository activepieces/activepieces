import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const listCardComments = createAction({
  auth: trelloAuth,
  name: 'list_card_comments',
  displayName: 'List Card Comments (Agent)',
  description: "Read a card's comment history.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists the comments on a Trello card identified by card_id, returning each comment's id (idAction), text, author, and date. Use the returned comment id with Update Comment / Delete Comment. Obtain card_id from Search Cards. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card. Obtain it from Search Cards.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of comments to return (1-1000, default 50).',
      required: false,
    }),
  },

  async run(context) {
    const params: QueryParams = { filter: 'commentCard' };
    if (context.propsValue['limit']) {
      params['limit'] = String(context.propsValue['limit']);
    }
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/actions`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, params),
      };
      const response = await httpClient.sendRequest<
        Array<Record<string, unknown>>
      >(request);
      const comments = response.body ?? [];
      return { comments, count: comments.length };
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Card not found. Verify the card_id (resolve it via Search Cards).'
      );
    }
  },
});
