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
  description: 'Get a specific attachment on a card',
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
    }),
    fields: Property.LongText({
      description: 'Comma-separated list of attachment fields to return (default: all)',
      displayName: 'Fields',
      required: false,
    }),
  },

  async run(context) {
    const queryParams: any = {};
    
    if (context.propsValue['fields']) {
      queryParams.fields = context.propsValue['fields'];
    }

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
      queryParams,
    };
    
    const response = await httpClient.sendRequest(request);

    return response.body;
  },
});
