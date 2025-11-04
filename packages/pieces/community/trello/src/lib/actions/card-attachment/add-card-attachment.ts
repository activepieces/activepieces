import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import FormData from "form-data";

export const addCardAttachment = createAction({
  auth: trelloAuth,
  name: 'add_card_attachment',
  displayName: 'Add Card Attachment',
  description: 'Adds an attachment to a card.',
  props: {
    card_id: Property.ShortText({
      description: 'The ID of the card to add attachment to',
      displayName: 'Card ID',
      required: true,
    }),
    attachment: Property.File({
      displayName: 'Attachment File',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Attachment Name',
      required: false,
    }),
    mime_type: Property.ShortText({
      displayName: 'MIME Type',
      required: false,
    }),
    set_cover: Property.Checkbox({
      description: 'Set this attachment as the card cover',
      displayName: 'Set as Cover',
      required: false,
    }),
  },

  async run(context) {
    const attachment = context.propsValue.attachment;
    const qs:QueryParams = {}
    
    const formData = new FormData();

    formData.append('file',attachment.data,{filename:attachment.filename});

    if (context.propsValue['name']) {
      qs['name'] = context.propsValue['name'];
    }
    
    if (context.propsValue['mime_type']) {
      qs['mimeType'] = context.propsValue['mime_type'];
    }
    
    if (context.propsValue['set_cover']) {
      qs['setCover'] = context.propsValue['set_cover'] ?'true':'false';
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url:
        `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/attachments` +
        `?key=` +
        context.auth.username +
        `&token=` +
        context.auth.password,
      headers: {
        Accept: 'application/json',
        ...formData.getHeaders()
      },
      body:formData,
      queryParams: qs,
    };
    
    const response = await httpClient.sendRequest(request);

    return response.body;
  },
});