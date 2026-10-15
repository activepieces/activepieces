import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { deleteLabelActionOutputSchema } from '../../output-schemas';

export const deleteLabel = createAction({
  auth: trelloAuth,
  name: 'delete_label',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Label (Agent)',
  description: 'Permanently delete a label from its board.',
  audience: 'ai',
  outputSchema: deleteLabelActionOutputSchema,
  aiMetadata: {
    description:
      'Permanently deletes a label from its board, which also strips it from every card that carried it. This affects the whole board rather than one card, so use Remove Label From Card when the intent is to untag a single card. Resolve the label_id with List Board Labels first; deleting an already-deleted label errors rather than succeeding, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    label_id: Property.ShortText({
      displayName: 'Label ID',
      description:
        'The ID of the label to delete. Obtain it from List Board Labels.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${trelloCommon.baseUrl}labels/${context.propsValue['label_id']}`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
      };
      await httpClient.sendRequest(request);
      return { success: true, label_id: context.propsValue['label_id'] };
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Label not found. Verify the label_id (resolve it via List Board Labels).'
      );
    }
  },
});
