import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { updateChecklistItemActionOutputSchema } from '../../output-schemas';

export const updateChecklistItem = createAction({
  auth: trelloAuth,
  name: 'update_checklist_item',
  classification: 'WRITE',
  displayName: 'Update Checklist Item (Agent)',
  description: 'Rename or reposition an item inside a checklist.',
  audience: 'ai',
  outputSchema: updateChecklistItemActionOutputSchema,
  aiMetadata: {
    description:
      'Renames a checklist item or moves it within its checklist, and can also set its complete or incomplete state in the same call. Anything left unset keeps its current value. Use Set Checklist Item State when only ticking or unticking is needed, and Add Checklist Item to create a new entry. Re-sending the same values converges on the same state, so it is idempotent.',
    idempotent: true,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card the checklist belongs to.',
      required: true,
    }),
    checkitem_id: Property.ShortText({
      displayName: 'Checklist Item ID',
      description:
        'The ID of the checklist item. Obtain it from List Card Checklists.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New text for the item. Leave empty to keep it.',
      required: false,
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      description: 'Completion state. Leave empty to keep it.',
      required: false,
      options: {
        options: [
          { label: 'Complete', value: 'complete' },
          { label: 'Incomplete', value: 'incomplete' },
        ],
      },
    }),
    position: Property.StaticDropdown({
      displayName: 'Position',
      description:
        'Where the item sits within its checklist. Leave empty to keep it.',
      required: false,
      options: {
        options: [
          { label: 'Top', value: 'top' },
          { label: 'Bottom', value: 'bottom' },
        ],
      },
    }),
  },

  async run(context) {
    const params: QueryParams = {};
    if (context.propsValue['name']) {
      params['name'] = context.propsValue['name'];
    }
    if (context.propsValue['state']) {
      params['state'] = context.propsValue['state'];
    }
    if (context.propsValue['position']) {
      params['pos'] = context.propsValue['position'];
    }

    if (Object.keys(params).length === 0) {
      throw new Error(
        'Provide a name, state or position to update on the checklist item.'
      );
    }

    try {
      const request: HttpRequest = {
        method: HttpMethod.PUT,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/checkItem/${context.propsValue['checkitem_id']}`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, params),
      };
      const response = await httpClient.sendRequest<Record<string, unknown>>(
        request
      );
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Card or checklist item not found. Verify the card_id and checkitem_id (resolve them via List Card Checklists).'
      );
    }
  },
});
