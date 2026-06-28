import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const listCardChecklists = createAction({
  auth: trelloAuth,
  name: 'list_card_checklists',
  displayName: 'List Card Checklists (Agent)',
  description: "List a card's checklists and their items.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists the checklists on a Trello card, each with its idChecklist and its check items (idCheckItem, name, state). This is the source for the ids needed by Set Checklist Item State, Add Checklist Item, Delete Checklist, and Delete Checklist Item. Obtain card_id from Search Cards. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card. Obtain it from Search Cards.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/checklists`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, { checkItems: 'all' }),
      };
      const response = await httpClient.sendRequest<
        Array<Record<string, unknown>>
      >(request);
      const checklists = response.body ?? [];
      return { checklists, count: checklists.length };
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Card not found. Verify the card_id (resolve it via Search Cards).'
      );
    }
  },
});
