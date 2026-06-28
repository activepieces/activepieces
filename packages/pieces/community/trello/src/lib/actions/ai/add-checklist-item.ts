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

// VERIFY-AT-AUTHORING: this atomic is authored from the real, documented
// Trello REST verb `POST /1/checklists/{idChecklist}/checkItems` (name required,
// optional `checked` and `pos`). It had no exact Composio union slug in the
// harvest, so confirm the endpoint shape against Trello's live API docs / a
// real call before relying on it. Without it the checklist family is read+state-
// only (see trello-coverage.md tension #3 / open question #2).
export const addChecklistItem = createAction({
  auth: trelloAuth,
  name: 'add_checklist_item',
  displayName: 'Add Checklist Item (Agent)',
  description: 'Add an item to a Trello checklist.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a check item to an existing Trello checklist. Obtain checklist_id (idChecklist) from List Card Checklists (or the output of Add Checklist To Card). Each call adds a distinct item, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    checklist_id: Property.ShortText({
      displayName: 'Checklist ID',
      description:
        'The checklist id (idChecklist). Obtain it from List Card Checklists or Add Checklist To Card.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Item Name',
      required: true,
    }),
    checked: Property.Checkbox({
      displayName: 'Checked',
      description: 'Create the item already marked complete.',
      required: false,
    }),
  },

  async run(context) {
    const params: QueryParams = {
      name: context.propsValue['name'],
    };
    if (context.propsValue['checked'] !== undefined) {
      params['checked'] = context.propsValue['checked'] ? 'true' : 'false';
    }
    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${trelloCommon.baseUrl}checklists/${context.propsValue['checklist_id']}/checkItems`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, params),
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Checklist not found. Verify the checklist_id (resolve it via List Card Checklists).'
      );
    }
  },
});
