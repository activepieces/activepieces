import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const deleteComment = createAction({
  auth: trelloAuth,
  name: 'delete_comment',
  displayName: 'Delete Comment (Agent)',
  description: 'Delete a comment from a Trello card.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes a comment on a Trello card, identified by card_id and comment_id (the action id). Obtain card_id from Search Cards and comment_id from List Card Comments. Deleting the same comment again returns an error once it no longer exists, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card. Obtain it from Search Cards.',
      required: true,
    }),
    comment_id: Property.ShortText({
      displayName: 'Comment ID',
      description: 'The comment (action) id. Obtain it from List Card Comments.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/actions/${context.propsValue['comment_id']}/comments`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Card or comment not found (it may already be deleted). Verify the card_id and comment_id.'
      );
    }
  },
});
