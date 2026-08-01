import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { waflyAuth, waflyApiCall, normalizePhone } from '../common';

/**
 * Image, video, audio and document are four routes with almost the same body,
 * so they are one action with a Media Type dropdown instead of four actions
 * cluttering the picker.
 */
const MEDIA_ROUTES = {
  image: { uri: '/send-image', field: 'image' },
  video: { uri: '/send-video', field: 'video' },
  audio: { uri: '/send-audio', field: 'audio' },
  document: { uri: '/send-document/pdf', field: 'document' },
} as const;

type MediaType = keyof typeof MEDIA_ROUTES;

export const sendMedia = createAction({
  auth: waflyAuth,
  name: 'send_media',
  displayName: 'Send Media',
  description: 'Send an image, video, audio or document over WhatsApp.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends a media file (image, video, audio or PDF document) over WhatsApp from a connected Wafly instance. The file is provided as a public URL or a base64 data URI. Captions apply to image, video and document. Not idempotent: each call delivers a new message.',
    idempotent: false,
  },
  props: {
    phone: Property.ShortText({
      displayName: 'To',
      description:
        'Phone number in international format (e.g. 5511999999999) or a group ID.',
      required: true,
    }),
    mediaType: Property.StaticDropdown({
      displayName: 'Media Type',
      required: true,
      defaultValue: 'image',
      options: {
        options: [
          { label: 'Image', value: 'image' },
          { label: 'Video', value: 'video' },
          { label: 'Audio', value: 'audio' },
          { label: 'Document (PDF)', value: 'document' },
        ],
      },
    }),
    url: Property.ShortText({
      displayName: 'File URL or Base64',
      description: 'A publicly reachable URL, or a base64 data URI.',
      required: true,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'Ignored for audio.',
      required: false,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Document only. Shown to the recipient.',
      required: false,
    }),
  },
  async run(context) {
    const { phone, mediaType, url, caption, fileName } = context.propsValue;
    const route = MEDIA_ROUTES[mediaType as MediaType];

    const body: Record<string, unknown> = {
      phone: normalizePhone(phone),
      [route.field]: url,
    };

    // Audio carries no caption, and only the document route reads fileName.
    if (mediaType !== 'audio' && caption) {
      body['caption'] = caption;
    }
    if (mediaType === 'document' && fileName) {
      body['fileName'] = fileName;
    }

    return await waflyApiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: route.uri,
      body,
    });
  },
});
