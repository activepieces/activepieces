import { createAction, Property } from '@activepieces/pieces-framework';
import { toBuffer } from 'qrcode';

export const outputQrcodeAction = createAction({
  audience: 'both',
  name: 'text_to_qrcode',
  displayName: 'Text to QR Code',
  description: 'Convert text to QR code',
  aiMetadata: { description: 'Encodes a text string (URL, plain text, or any short payload) into a QR code image and returns it as a PNG file; this piece has no counterpart action for decoding or reading a QR code. Takes only the text content - no size, margin, or color options - and throws if the content exceeds the QR format\'s few-kilobyte capacity ceiling; deterministic and idempotent.', idempotent: true },
  props: {
    text: Property.LongText({
      displayName: 'Content',
      required: true,
    }),
  },
  async run(context) {
    const { text } = context.propsValue;

    const qrcodeBuffer = await toBuffer(text);

    return await context.files.write({
      fileName: 'qr-code.png',
      data: qrcodeBuffer,
    });
  },
});
