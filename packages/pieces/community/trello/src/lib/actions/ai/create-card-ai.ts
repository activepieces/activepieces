import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { TrelloCard } from '../../common/props/card';
import { trelloAuth } from '../../..';
import { createCardAiActionOutputSchema } from '../../output-schemas';

export const createCardAi = createAction({
  auth: trelloAuth,
  name: 'create_card_ai',
  displayName: 'Create Card (Agent)',
  description: 'Create a new card in a Trello list.',
  audience: 'ai',
  outputSchema: createCardAiActionOutputSchema,
  aiMetadata: {
    description:
      'Creates a new Trello card in a specific list, optionally with a description, position (top/bottom), and label ids. Requires the target list_id (resolve it via List Lists for a board, which you can find via List Boards). Each call creates a distinct card, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description:
        'The ID of the list to create the card in. Obtain it from List Lists (which takes a board_id from List Boards).',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Card Name',
      description: 'The name of the card to create.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Card Description',
      description: 'The description of the card to create.',
      required: false,
    }),
    position: Property.StaticDropdown({
      displayName: 'Position',
      description: 'Place the card on top or bottom of the list.',
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
        'Label ids to attach to the card. Obtain them from List Board Labels.',
      required: false,
    }),
  },

  async run(context) {
    try {
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
          idLabels: context.propsValue['labels'] as string[] | undefined,
        },
        queryParams: {},
      };
      const response = await httpClient.sendRequest<TrelloCard>(request);
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        throw new Error(
          'Permission denied creating the card. Check the connection token and that you can write to the list.'
        );
      }
      if (status === 404) {
        throw new Error(
          'List not found. Verify the list_id (resolve it via List Lists).'
        );
      }
      if (status === 429) {
        throw new Error('Trello rate limit exceeded. Retry after a short delay.');
      }
      throw error;
    }
  },
});
