import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const deleteChecklist = createAction({
  auth: trelloAuth,
  name: 'delete_checklist',
  displayName: 'Delete Checklist (Agent)',
  description: 'Delete a whole checklist.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes an entire checklist (and all of its items) identified by checklist_id. Obtain checklist_id (idChecklist) from List Card Checklists. Deleting the same checklist again returns an error once it no longer exists, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    checklist_id: Property.ShortText({
      displayName: 'Checklist ID',
      description:
        'The checklist id (idChecklist). Obtain it from List Card Checklists.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${trelloCommon.baseUrl}checklists/${context.propsValue['checklist_id']}`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Checklist not found (it may already be deleted). Verify the checklist_id.'
      );
    }
  },
});
