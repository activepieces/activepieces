import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const addLabelToCard = createAction({
  auth: trelloAuth,
  name: 'add_label_to_card',
  displayName: 'Add Label To Card (Agent)',
  description: 'Attach an existing label to a Trello card.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Attaches an existing board label to a Trello card. Obtain card_id from Search Cards and label_id from List Board Labels (or Create Board Label). Re-attaching an already-present label converges to the same label set, so it is idempotent.',
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
        'The label id to attach. Obtain it from List Board Labels or Create Board Label.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/idLabels`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, {
          value: context.propsValue['label_id'],
        }),
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
