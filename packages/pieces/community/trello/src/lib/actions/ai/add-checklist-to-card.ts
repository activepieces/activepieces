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

export const addChecklistToCard = createAction({
  auth: trelloAuth,
  name: 'add_checklist_to_card',
  displayName: 'Add Checklist To Card (Agent)',
  description: 'Create a checklist on a Trello card.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a checklist on a Trello card and returns its idChecklist, which you then pass to Add Checklist Item and Set Checklist Item State. Obtain card_id from Search Cards. Each call creates a distinct checklist, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card. Obtain it from Search Cards.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Checklist Name',
      required: false,
    }),
  },

  async run(context) {
    const params: QueryParams = {};
    if (context.propsValue['name']) {
      params['name'] = context.propsValue['name'] as string;
    }
    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/checklists`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, params),
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Card not found. Verify the card_id (resolve it via Search Cards).'
      );
    }
  },
});
