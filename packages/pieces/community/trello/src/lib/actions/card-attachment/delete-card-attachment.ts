import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';

export const deleteCardAttachment = createAction({
  auth: trelloAuth,
  name: 'delete_card_attachment',
  displayName: 'Delete Card Attachment',
  description: 'Deletes an attachment from a card.',
  audience: 'both',
  aiMetadata: { description: 'Permanently removes a specific attachment from a Trello card, identified by both card_id and attachment_id. Use to delete a file or link from a card. Requires both ids; deleting the same attachment again returns an error once it no longer exists.', idempotent: false },
  props: {
    card_id: Property.ShortText({
      description: 'The ID of the card',
      displayName: 'Card ID',
      required: true,
    }),
    attachment_id: Property.ShortText({
      description: 'The ID of the attachment to delete',
      displayName: 'Attachment ID',
      required: true,
    }),
  },

  async run(context) {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url:
        `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/attachments/${context.propsValue['attachment_id']}` +
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
  },
});