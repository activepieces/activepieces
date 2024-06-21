import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { whatsappAuth } from '../..';
import { supportedMediaTypes, capitalizeFirstLetter, mediaTypeSupportsCaption } from '../common/utils';

export const sendMedia = createAction({
  auth: whatsappAuth,
  name: 'sendMedia',
  displayName: 'Send Media',
  description: 'Send a media message through WhatsApp',
  props: {
    to: Property.ShortText({
      displayName: 'To',
      description: 'The recipient of the message',
      required: true,
    }),
    type: Property.Dropdown({
      displayName: 'Type',
      description: 'The type of media to send',
      required: true,
      options: async () => {
        return {
          options: supportedMediaTypes.map((type) => ({
            label: capitalizeFirstLetter(type),
            value: type,
          })),
        };
      },
      refreshers: []
    }),
    media: Property.ShortText({
      displayName: 'Media URL',
      description: 'The URL of the media to send',
      required: true,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'A caption for the media',
      required: false,
    }),
    filename: Property.LongText({
      displayName: 'Filename',
      description: 'Filename of the document to send',
      required: false,
    }),
  },
  async run(context) {
    const { to, caption, media, type, filename } = context.propsValue;
    const { access_token, phoneNumberId } = context.auth;
    const body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type,
      [type]: {
          link: media,
      }
    }
    if (caption && mediaTypeSupportsCaption(type)) (body[type] as any).caption = caption;
    if (filename && type === 'document') (body[type] as any).filename = filename;
    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      headers: {
        Authorization: 'Bearer ' + access_token,
      },
      body,
    });
  },
});