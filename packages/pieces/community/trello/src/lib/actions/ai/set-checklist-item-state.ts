import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const setChecklistItemState = createAction({
  auth: trelloAuth,
  name: 'set_checklist_item_state',
  displayName: 'Set Checklist Item State (Agent)',
  description: 'Check or uncheck a checklist item.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Marks a checklist item complete or incomplete. This needs three ids that all come from List Card Checklists for the card: card_id, checklist_id (idChecklist), and checkitem_id (idCheckItem). Setting the same state again converges, so it is idempotent.',
    idempotent: true,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card. Obtain it from Search Cards.',
      required: true,
    }),
    checklist_id: Property.ShortText({
      displayName: 'Checklist ID',
      description:
        'The checklist id (idChecklist). Obtain it from List Card Checklists.',
      required: true,
    }),
    checkitem_id: Property.ShortText({
      displayName: 'Check Item ID',
      description:
        'The check item id (idCheckItem). Obtain it from List Card Checklists.',
      required: true,
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      required: true,
      options: {
        options: [
          { label: 'Complete', value: 'complete' },
          { label: 'Incomplete', value: 'incomplete' },
        ],
      },
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.PUT,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/checklist/${context.propsValue['checklist_id']}/checkItem/${context.propsValue['checkitem_id']}/state`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, {
          value: context.propsValue['state'],
        }),
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Card, checklist, or check item not found. Verify all three ids via List Card Checklists.'
      );
    }
  },
});
