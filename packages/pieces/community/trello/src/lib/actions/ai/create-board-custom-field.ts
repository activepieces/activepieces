import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { customFieldActionOutputSchema } from '../../output-schemas';

export const createBoardCustomField = createAction({
  auth: trelloAuth,
  name: 'create_board_custom_field',
  classification: 'WRITE',
  displayName: 'Create Board Custom Field (Agent)',
  description: 'Define a new custom field on a board.',
  audience: 'ai',
  outputSchema: customFieldActionOutputSchema,
  aiMetadata: {
    description:
      'Defines a new custom field on a board and returns its id. Use it when a board lacks a field the workflow needs; check List Board Custom Fields first, because Trello allows two fields with the same name and each call creates another one. A dropdown field is created empty, so follow up with Create Custom Field Option for each choice before any card can be given a value. Requires the Custom Fields Power-Up on the board; not idempotent.',
    idempotent: false,
  },
  props: {
    board_id: Property.ShortText({
      displayName: 'Board ID',
      description: 'The ID of the board. Obtain it from List Boards.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the custom field.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'The kind of value the field holds. It cannot be changed later.',
      required: true,
      options: {
        options: [
          { label: 'Text', value: 'text' },
          { label: 'Number', value: 'number' },
          { label: 'Date', value: 'date' },
          { label: 'Checkbox', value: 'checkbox' },
          { label: 'Dropdown (list)', value: 'list' },
        ],
      },
    }),
    display_on_card: Property.Checkbox({
      displayName: 'Show on Card Front',
      description: 'Display the field on the front of the card.',
      required: false,
      defaultValue: false,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${trelloCommon.baseUrl}customFields`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        queryParams: withAuthParams(context.auth),
        body: {
          idModel: context.propsValue['board_id'],
          modelType: 'board',
          name: context.propsValue['name'],
          type: context.propsValue['type'],
          pos: 'bottom',
          display_cardFront: context.propsValue['display_on_card'] === true,
        },
      };
      const response = await httpClient.sendRequest<Record<string, unknown>>(
        request
      );
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Board not found. Verify the board_id, and that the Custom Fields Power-Up is enabled on the board.'
      );
    }
  },
});
