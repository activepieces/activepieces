import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { moveCardActionOutputSchema } from '../../output-schemas';

export const moveCard = createAction({
  auth: trelloAuth,
  name: 'move_card',
  displayName: 'Move Card (Agent)',
  description: 'Move a Trello card to a different list.',
  audience: 'ai',
  outputSchema: moveCardActionOutputSchema,
  aiMetadata: {
    description:
      'Moves a Trello card to a different list (the high-intent single-purpose alternative to Update Card). Obtain card_id from Search Cards and the destination list_id from List Lists. Moving to the list it is already in converges to the same state, so it is idempotent.',
    idempotent: true,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card to move. Obtain it from Search Cards.',
      required: true,
    }),
    list_id: Property.ShortText({
      displayName: 'Destination List ID',
      description:
        'The list to move the card into. Obtain it from List Lists.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.PUT,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/idList`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, {
          value: context.propsValue['list_id'],
        }),
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Card or list not found. Verify the card_id and list_id (resolve via Search Cards / List Lists).'
      );
    }
  },
});
