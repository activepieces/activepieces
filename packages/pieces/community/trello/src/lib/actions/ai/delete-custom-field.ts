import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const deleteCustomField = createAction({
  auth: trelloAuth,
  name: 'delete_custom_field',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Custom Field (Agent)',
  description: 'Permanently delete a custom field and every value stored in it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a custom field definition from its board, discarding the value every card held in that field. This cannot be undone and affects all cards on the board at once, so confirm the field with Get Custom Field first. Deleting an already-deleted field errors rather than succeeding, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    custom_field_id: Property.ShortText({
      displayName: 'Custom Field ID',
      description:
        'The ID of the custom field to delete. Obtain it from List Board Custom Fields.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${trelloCommon.baseUrl}customFields/${context.propsValue['custom_field_id']}`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
      };
      await httpClient.sendRequest(request);
      return {
        success: true,
        custom_field_id: context.propsValue['custom_field_id'],
      };
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Custom field not found. Verify the custom_field_id (resolve it via List Board Custom Fields).'
      );
    }
  },
});
