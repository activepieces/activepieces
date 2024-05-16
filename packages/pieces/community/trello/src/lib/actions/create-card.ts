import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../common';
import { TrelloCard } from '../common/props/card';
import { trelloAuth } from '../..';

export const createCard = createAction({
  auth: trelloAuth,
  name: 'create_card',
  displayName: 'Create Card',
  description: 'Create a new card in Trello',
  props: {
    board_id: trelloCommon.board_id,
    list_id: trelloCommon.list_id,
    name: Property.ShortText({
      description: 'The name of the card to create',
      displayName: 'Task Name',
      required: true,
    }),
    description: Property.LongText({
      description: 'The description of the card to create',
      displayName: 'Task Description',
      required: false,
    }),
    position: Property.StaticDropdown({
      description: 'Place the card on top or bottom of the list',
      displayName: 'Position',
      required: false,
      options: {
        options: [
          { label: 'Top', value: 'top' },
          { label: 'Bottom', value: 'bottom' },
        ],
      },
    }),
    labels: trelloCommon.board_labels,
  },

  async run(context) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url:
        `${trelloCommon.baseUrl}cards` +
        `?idList=` +
        context.propsValue['list_id'] +
        `&key=` +
        context.auth.username +
        `&token=` +
        context.auth.password,
      headers: {
        Accept: 'application/json',
      },
      body: {
        name: context.propsValue['name'],
        desc: context.propsValue['description'],
        pos: context.propsValue['position'],
        idLabels: context.propsValue['labels'],
      },
      queryParams: {},
    };
    const response = await httpClient.sendRequest<TrelloCard>(request);

    return response.body;
  },
});
