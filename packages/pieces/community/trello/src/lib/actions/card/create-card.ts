import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { TrelloCard } from '../../common/props/card';
import { trelloAuth } from '../../..';
import { createCardActionOutputSchema } from '../../output-schemas';

export const createCard = createAction({
  auth: trelloAuth,
  name: 'create_card',
  classification: 'WRITE',
  displayName: 'Create Card',
  description: 'Create a new card in Trello',
  audience: 'human',
  outputSchema: createCardActionOutputSchema,
  aiMetadata: { description: 'Creates a new Trello card in a specific list, optionally with a description, position, and labels. Use to add a task or item to a board. Requires the target list_id (and the board_id it belongs to); each call creates a distinct card, so it is not idempotent.', idempotent: false },
  propertyGroups: [
    { key: 'destination', display: 'section', label: 'Where to Add', icon: 'inbox', props: ['board_id', 'list_id'] },
    { key: 'details', display: 'section', label: 'Card Details', icon: 'text', props: ['name', 'description', 'position', 'labels'] },
  ],
  props: {
    board_id: trelloCommon.board_id,
    list_id: trelloCommon.list_id,
    name: Property.ShortText({
      displayName: 'Card Name',
      placeholder: 'Write the launch post',
      required: true,
    }),
    description: Property.LongText({
      description: 'Markdown formatting is supported.',
      displayName: 'Card Description',
      required: false,
    }),
    position: Property.StaticDropdown({
      description: 'Empty adds the card at the bottom of the list.',
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
