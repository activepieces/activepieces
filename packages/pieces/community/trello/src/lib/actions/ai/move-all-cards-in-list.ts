import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const moveAllCardsInList = createAction({
  auth: trelloAuth,
  name: 'move_all_cards_in_list',
  displayName: 'Move All Cards In List (Agent)',
  description: 'Move every card from one Trello list to another.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves every card from a source list to a destination list (e.g. clear a "Done" column into an "Archive" list). Obtain board_id from List Boards and both list ids from List Lists; the destination list must be on the given board. This is a bulk mutation, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    list_id: Property.ShortText({
      displayName: 'Source List ID',
      description: 'The list to move all cards from. Obtain it from List Lists.',
      required: true,
    }),
    board_id: Property.ShortText({
      displayName: 'Destination Board ID',
      description:
        'The board the destination list belongs to. Obtain it from List Boards.',
      required: true,
    }),
    destination_list_id: Property.ShortText({
      displayName: 'Destination List ID',
      description: 'The list to move all cards into. Obtain it from List Lists.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${trelloCommon.baseUrl}lists/${context.propsValue['list_id']}/moveAllCards`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, {
          idBoard: context.propsValue['board_id'],
          idList: context.propsValue['destination_list_id'],
        }),
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'A list or board was not found. Verify the source list_id, destination board_id, and destination list_id.'
      );
    }
  },
});
