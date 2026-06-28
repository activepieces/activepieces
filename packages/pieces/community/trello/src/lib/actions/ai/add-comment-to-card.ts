import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const addCommentToCard = createAction({
  auth: trelloAuth,
  name: 'add_comment_to_card',
  displayName: 'Add Comment To Card (Agent)',
  description: 'Add a comment to a Trello card.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts a comment on a Trello card identified by card_id. This is the primary way for an agent to report status or notes on a card. Obtain card_id from Search Cards. Each call adds a new comment, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card to comment on. Obtain it from Search Cards.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Comment Text',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/actions/comments`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, {
          text: context.propsValue['text'],
        }),
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Card not found. Verify the card_id (resolve it via Search Cards).'
      );
    }
  },
});
