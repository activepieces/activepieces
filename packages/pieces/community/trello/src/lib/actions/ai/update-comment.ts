import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { updateCommentActionOutputSchema } from '../../output-schemas';

export const updateComment = createAction({
  auth: trelloAuth,
  name: 'update_comment',
  displayName: 'Update Comment (Agent)',
  description: 'Edit an existing comment on a Trello card.',
  audience: 'ai',
  outputSchema: updateCommentActionOutputSchema,
  aiMetadata: {
    description:
      'Edits the text of an existing comment on a Trello card, identified by card_id and comment_id (the action id). Obtain card_id from Search Cards and comment_id from List Card Comments. Setting the same text again converges to the same comment, so it is idempotent.',
    idempotent: true,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card. Obtain it from Search Cards.',
      required: true,
    }),
    comment_id: Property.ShortText({
      displayName: 'Comment ID',
      description:
        'The comment (action) id. Obtain it from List Card Comments.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'New Comment Text',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.PUT,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/actions/${context.propsValue['comment_id']}/comments`,
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
        'Card or comment not found. Verify the card_id and comment_id (resolve via List Card Comments).'
      );
    }
  },
});
