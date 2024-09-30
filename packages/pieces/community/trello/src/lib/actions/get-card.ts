import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../common';
import { TrelloCard } from '../common/props/card';
import { trelloAuth } from '../..';

export const getCard = createAction({
  auth: trelloAuth,
  name: 'get_card',
  displayName: 'Get Card',
  description: 'Get a card in Trello',
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
