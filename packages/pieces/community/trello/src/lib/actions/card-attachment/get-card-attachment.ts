import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';

export const getCardAttachment = createAction({
  auth: trelloAuth,
  name: 'get_card_attachment',
  displayName: 'Get Card Attachment',
  description: 'Gets a specific attachment on a card.',
  props: {
    card_id: Property.ShortText({
      description: 'The ID of the card',
      displayName: 'Card ID',
      required: true,
    }),
    attachment_id: Property.ShortText({
      description: 'The ID of the attachment to retrieve',
      displayName: 'Attachment ID',
      required: true,
    })
  },

  async run(context) {

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url:
        `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/attachments/${context.propsValue['attachment_id']}` +
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
  },
});
