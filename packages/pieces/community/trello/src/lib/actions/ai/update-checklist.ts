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
import { updateChecklistActionOutputSchema } from '../../output-schemas';

export const updateChecklist = createAction({
  auth: trelloAuth,
  name: 'update_checklist',
  classification: 'WRITE',
  displayName: 'Update Checklist (Agent)',
  description: "Rename a checklist or change its position on the card.",
  audience: 'ai',
  outputSchema: updateChecklistActionOutputSchema,
  aiMetadata: {
    description:
      'Renames a checklist or moves it up or down among the checklists on its card. Anything left unset keeps its current value, so the name can be corrected without touching the position. Use Update Checklist Item to change an entry inside the checklist rather than the checklist itself. Re-sending the same values converges on the same state, so it is idempotent.',
    idempotent: true,
  },
  props: {
    checklist_id: Property.ShortText({
      displayName: 'Checklist ID',
      description:
        'The ID of the checklist. Obtain it from List Card Checklists.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name for the checklist. Leave empty to keep it.',
      required: false,
    }),
    position: Property.StaticDropdown({
      displayName: 'Position',
      description:
        'Where the checklist sits among the card checklists. Leave empty to keep it.',
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
    if (context.propsValue['name'] !== undefined) {
      params['name'] = context.propsValue['name'];
    }
    if (context.propsValue['position'] !== undefined) {
      params['pos'] = context.propsValue['position'];
    }

    if (Object.keys(params).length === 0) {
      throw new Error(
        'Provide a name or a position to update on the checklist.'
      );
    }

    try {
      const request: HttpRequest = {
        method: HttpMethod.PUT,
        url: `${trelloCommon.baseUrl}checklists/${context.propsValue['checklist_id']}`,
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
        'Checklist not found. Verify the checklist_id (resolve it via List Card Checklists).'
      );
    }
  },
});
