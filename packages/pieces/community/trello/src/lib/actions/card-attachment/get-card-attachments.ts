import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';

export const getCardAttachments = createAction({
  auth: trelloAuth,
  name: 'get_card_attachments',
  displayName: 'Get All Card Attachments',
  description: 'Get all attachments on a card',
  props: {
    card_id: Property.ShortText({
      description: 'The ID of the card to get attachments from',
      displayName: 'Card ID',
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
        `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/attachments` +
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
