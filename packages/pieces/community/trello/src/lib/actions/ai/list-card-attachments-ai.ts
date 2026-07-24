import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { listCardAttachmentsAiActionOutputSchema } from '../../output-schemas';

export const listCardAttachmentsAi = createAction({
  auth: trelloAuth,
  name: 'list_card_attachments_ai',
  displayName: 'List Card Attachments (Agent)',
  description: 'List all attachments on a Trello card.',
  audience: 'ai',
  outputSchema: listCardAttachmentsAiActionOutputSchema,
  aiMetadata: {
    description:
      'Lists all attachments on a Trello card identified by card_id, returning each attachment id, name, and url. Use it to find an attachment id before fetching or deleting it. Obtain card_id from Search Cards. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description:
        'The ID of the card to list attachments for. Obtain it from Search Cards.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url:
          `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/attachments` +
          `?key=` +
          context.auth.username +
          `&token=` +
          context.auth.password,
        headers: {
          Accept: 'application/json',
        },
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        throw new Error(
          'Permission denied reading attachments. Check the connection token and your access to the board.'
        );
      }
      if (status === 404) {
        throw new Error(
          'Card not found. Verify the card_id (resolve it via Search Cards).'
        );
      }
      if (status === 429) {
        throw new Error('Trello rate limit exceeded. Retry after a short delay.');
      }
      throw error;
    }
  },
});
