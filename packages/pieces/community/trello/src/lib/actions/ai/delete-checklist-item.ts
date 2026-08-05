import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const deleteChecklistItem = createAction({
  auth: trelloAuth,
  name: 'delete_checklist_item',
  displayName: 'Delete Checklist Item (Agent)',
  description: 'Remove one item from a checklist.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes a single check item from a checklist. Both ids come from List Card Checklists: checklist_id (idChecklist) and checkitem_id (idCheckItem). Deleting the same item again returns an error once it no longer exists, so it is not idempotent.',
    idempotent: false,
  },
  props: {
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
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${trelloCommon.baseUrl}checklists/${context.propsValue['checklist_id']}/checkItems/${context.propsValue['checkitem_id']}`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Checklist or check item not found (it may already be deleted). Verify both ids via List Card Checklists.'
      );
    }
  },
});
