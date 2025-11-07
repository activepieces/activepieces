import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { TrelloCard } from '../../common/props/card';
import { trelloAuth } from '../../..';

export const updateCard = createAction({
  auth: trelloAuth,
  name: 'update_card',
  displayName: 'Update Card',
  description: 'Updates an existing card.',
  props: {
    card_id: Property.ShortText({
      description: 'The ID of the card to update',
      displayName: 'Card ID',
      required: true,
    }),
    name: Property.ShortText({
      description: 'The new name of the card',
      displayName: 'Card Name',
      required: false,
    }),
    description: Property.LongText({
      description: 'The new description of the card',
      displayName: 'Card Description',
      required: false,
    }),
    board_id: trelloCommon.board_id_opt,
    list_id: trelloCommon.list_id_opt,
    position: Property.StaticDropdown({
      description: 'Move the card to a new position',
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
    closed: Property.Checkbox({
      description: 'Archive or unarchive the card',
      displayName: 'Archived',
      required: false,
    }),
    due: Property.DateTime({
      description: 'Set a due date for the card',
      displayName: 'Due Date',
      required: false,
    }),
  },

  async run(context) {
    const body: any = {};
    
    if (context.propsValue['name']) {
      body.name = context.propsValue['name'];
    }
    
    if (context.propsValue['description']) {
      body.desc = context.propsValue['description'];
    }
    
    if (context.propsValue['list_id']) {
      body.idList = context.propsValue['list_id'];
    }
    
    if (context.propsValue['position']) {
      body.pos = context.propsValue['position'];
    }
    
    if (context.propsValue['labels']) {
      body.idLabels = context.propsValue['labels'];
    }
    
    if (context.propsValue['closed'] !== undefined) {
      body.closed = context.propsValue['closed'];
    }
    
    if (context.propsValue['due']) {
      body.due = context.propsValue['due'];
    }

    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url:
        `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}` +
        `?key=` +
        context.auth.username +
        `&token=` +
        context.auth.password,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body,
      queryParams: {},
    };
    
    const response = await httpClient.sendRequest<TrelloCard>(request);

    return response.body;
  },
});
