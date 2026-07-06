import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const addReactionToComment = createAction({
  auth: trelloAuth,
  name: 'add_reaction_to_comment',
  displayName: 'Add Reaction To Comment (Agent)',
  description: 'React (emoji) to a Trello comment.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds an emoji reaction to a comment action on a Trello card. Provide the comment id (action_id) from List Card Comments and identify the emoji by its shortName (e.g. "thumbsup"). Each call adds a reaction, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    action_id: Property.ShortText({
      displayName: 'Comment ID',
      description:
        'The comment (action) id to react to. Obtain it from List Card Comments.',
      required: true,
    }),
    short_name: Property.ShortText({
      displayName: 'Emoji Short Name',
      description: 'The emoji short name, e.g. "thumbsup", "heart", "tada".',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${trelloCommon.baseUrl}actions/${context.propsValue['action_id']}/reactions`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        queryParams: withAuthParams(context.auth),
        body: {
          shortName: context.propsValue['short_name'],
        },
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Comment (action) not found. Verify the action_id (resolve it via List Card Comments).'
      );
    }
  },
});
