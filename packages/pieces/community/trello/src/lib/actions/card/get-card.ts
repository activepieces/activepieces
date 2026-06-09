import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { TrelloCard } from '../../common/props/card';
import { trelloAuth } from '../../..';

export const getCard = createAction({
  auth: trelloAuth,
  name: 'get_card',
  displayName: 'Get Card',
  description: 'Gets a card by ID.',
  audience: 'both',
  aiMetadata: { description: 'Retrieves the full details of a single Trello card by its card ID. Use to look up the current name, description, due date, labels, list, and other fields of a card before acting on it. Read-only and idempotent.', idempotent: true },
  props: {
    cardId: Property.ShortText({
      description: 'The card ID',
      displayName: 'Card ID',
      required: true,
    }),
  },

  async run(context) {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url:
        `${trelloCommon.baseUrl}cards/` +
        context.propsValue['cardId'] +
        `?key=` +
        context.auth.username +
        `&token=` +
        context.auth.password,
      headers: {
        Accept: 'application/json',
      },
    };
    return (await httpClient.sendRequest<TrelloCard>(request)).body;
  },
});
