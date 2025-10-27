import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';

export const addCardAttachment = createAction({
  auth: trelloAuth,
  name: 'add_card_attachment',
  displayName: 'Add Card Attachment',
  description: 'Add an attachment to a card',
  props: {
    card_id: Property.ShortText({
      description: 'The ID of the card to add attachment to',
      displayName: 'Card ID',
      required: true,
    }),
    attachment_type: Property.StaticDropdown({
      description: 'Type of attachment to add',
      displayName: 'Attachment Type',
      required: true,
      options: {
        options: [
          { label: 'URL', value: 'url' },
          { label: 'File', value: 'file' },
        ],
      },
    }),
    attachment_details: Property.DynamicProperties({
      displayName: 'Attachment Details',
      required: true,
      refreshers: ['attachment_type'],
      async props({ attachment_type }) {
        const propsBuilders: Record<string, () => DynamicPropsValue> = {
          url: () => ({
            url: Property.LongText({
              description: 'URL to attach',
              displayName: 'URL',
              required: true,
            }),
          }),
          file: () => ({
            file: Property.File({
              description: 'File to attach',
              displayName: 'File',
              required: true,
            }),
          }),
        };
        
        if (!attachment_type || typeof attachment_type !== 'string' || !propsBuilders[attachment_type]) {
          return {};
        }
        
        return propsBuilders[attachment_type]();
      },
    }),
    name: Property.ShortText({
      description: 'Name of the attachment',
      displayName: 'Attachment Name',
      required: false,
    }),
    mime_type: Property.ShortText({
      description: 'MIME type of the attachment',
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
    const attachmentType = context.propsValue['attachment_type'];
    const attachmentDetails = context.propsValue['attachment_details'];
    const body: any = {};
    
    if (attachmentType === 'url' && attachmentDetails?.['url']) {
      body.url = attachmentDetails['url'];
    } else if (attachmentType === 'file' && attachmentDetails?.['file']) {
      body.file = attachmentDetails['file'];
    }
    
    if (context.propsValue['name']) {
      body.name = context.propsValue['name'];
    }
    
    if (context.propsValue['mime_type']) {
      body.mimeType = context.propsValue['mime_type'];
    }
    
    if (context.propsValue['set_cover']) {
      body.setCover = context.propsValue['set_cover'];
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
      },
      body,
      queryParams: {},
    };
    
    const response = await httpClient.sendRequest(request);

    return response.body;
  },
});