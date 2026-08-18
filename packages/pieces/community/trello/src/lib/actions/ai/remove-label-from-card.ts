import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const removeLabelFromCard = createAction({
  auth: trelloAuth,
  name: 'remove_label_from_card',
  displayName: 'Remove Label From Card (Agent)',
  description: 'Detach a label from a Trello card.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Detaches a label from a Trello card. Obtain card_id from Search Cards and label_id from Get Card or List Board Labels. Removing an already-absent label converges to the same state, so it is idempotent.',
    idempotent: true,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card. Obtain it from Search Cards.',
      required: true,
    }),
    label_id: Property.ShortText({
      displayName: 'Label ID',
      description:
        'The label id to detach. Obtain it from Get Card or List Board Labels.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/idLabels/${context.propsValue['label_id']}`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Card or label not found. Verify the card_id and label_id.'
      );
    }
  },
});
