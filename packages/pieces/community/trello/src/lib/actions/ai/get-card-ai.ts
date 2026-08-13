import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { TrelloCard } from '../../common/props/card';
import { trelloAuth } from '../../..';
import { getCardAiActionOutputSchema } from '../../output-schemas';

export const getCardAi = createAction({
  auth: trelloAuth,
  name: 'get_card_ai',
  displayName: 'Get Card (Agent)',
  description: 'Get the full details of a Trello card by ID.',
  audience: 'ai',
  outputSchema: getCardAiActionOutputSchema,
  aiMetadata: {
    description:
      'Retrieves the full details of a single Trello card by its card_id (name, description, due date, labels, list, members, and more). Obtain the card_id from Search Cards, List Cards In List, or List Cards In Board. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description:
        'The ID of the card. Obtain it from Search Cards, List Cards In List, or List Cards In Board.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url:
          `${trelloCommon.baseUrl}cards/` +
          context.propsValue['card_id'] +
          `?key=` +
          context.auth.username +
          `&token=` +
          context.auth.password,
        headers: {
          Accept: 'application/json',
        },
      };
      return (await httpClient.sendRequest<TrelloCard>(request)).body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        throw new Error(
          'Permission denied reading the card. Check the connection token and your access to the board.'
        );
      }
      if (status === 404) {
        throw new Error(
          'Card not found. Verify the card_id (resolve it via Search Cards).'
        );
      }
      if (status === 429) {
        throw new Error('Trello rate limit exceeded. Retry after a short delay.');
      }
      throw error;
    }
  },
});
