import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { TrelloCard } from '../../common/props/card';
import { trelloAuth } from '../../..';

export const updateCardAi = createAction({
  auth: trelloAuth,
  name: 'update_card_ai',
  displayName: 'Update Card (Agent)',
  description: 'Update fields on an existing Trello card.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates fields on an existing Trello card identified by card_id: name, description, due date, label ids, position, archived (closed) state, and target list_id (to move it). This is the broad editor; for a single high-intent change prefer Move Card or Archive Card. Obtain card_id from Search Cards and list_id from List Lists. Only provided fields change; repeating with the same inputs converges to the same card state.',
    idempotent: true,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card to update. Obtain it from Search Cards.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Card Name',
      description: 'The new name of the card.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Card Description',
      description: 'The new description of the card.',
      required: false,
    }),
    list_id: Property.ShortText({
      displayName: 'List ID',
      description:
        'Move the card to this list. Obtain the list id from List Lists.',
      required: false,
    }),
    position: Property.StaticDropdown({
      displayName: 'Position',
      description: 'Move the card to a new position.',
      required: false,
      options: {
        options: [
          { label: 'Top', value: 'top' },
          { label: 'Bottom', value: 'bottom' },
        ],
      },
    }),
    labels: Property.Array({
      displayName: 'Label IDs',
      description:
        'Replace the card label set with these label ids. Obtain them from List Board Labels.',
      required: false,
    }),
    closed: Property.Checkbox({
      displayName: 'Archived',
      description: 'Archive (true) or unarchive (false) the card.',
      required: false,
    }),
    due: Property.DateTime({
      displayName: 'Due Date',
      description: 'Set a due date for the card.',
      required: false,
    }),
  },

  async run(context) {
    const body: Record<string, unknown> = {};

    if (context.propsValue['name']) {
      body['name'] = context.propsValue['name'];
    }
    if (context.propsValue['description']) {
      body['desc'] = context.propsValue['description'];
    }
    if (context.propsValue['list_id']) {
      body['idList'] = context.propsValue['list_id'];
    }
    if (context.propsValue['position']) {
      body['pos'] = context.propsValue['position'];
    }
    if (context.propsValue['labels']) {
      body['idLabels'] = context.propsValue['labels'] as string[];
    }
    if (context.propsValue['closed'] !== undefined) {
      body['closed'] = context.propsValue['closed'];
    }
    if (context.propsValue['due']) {
      body['due'] = context.propsValue['due'];
    }

    try {
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
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        throw new Error(
          'Permission denied updating the card. Check the connection token and your write access.'
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
