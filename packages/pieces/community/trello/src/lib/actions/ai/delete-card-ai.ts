import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';

export const deleteCardAi = createAction({
  auth: trelloAuth,
  name: 'delete_card_ai',
  displayName: 'Delete Card (Agent)',
  description: 'Permanently delete a Trello card by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a Trello card by its card_id. This is irreversible; prefer Archive Card (recoverable) unless the card must be erased entirely. Obtain card_id from Search Cards. Deleting the same id again returns an error once it no longer exists, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card to delete. Obtain it from Search Cards.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url:
          `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}` +
          `?key=` +
          context.auth.username +
          `&token=` +
          context.auth.password,
        headers: {
          Accept: 'application/json',
        },
        queryParams: {},
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        throw new Error(
          'Permission denied deleting the card. Check the connection token and your write access.'
        );
      }
      if (status === 404) {
        throw new Error(
          'Card not found (it may already be deleted). Verify the card_id.'
        );
      }
      if (status === 429) {
        throw new Error('Trello rate limit exceeded. Retry after a short delay.');
      }
      throw error;
    }
  },
});
