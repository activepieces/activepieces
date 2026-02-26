import { createAction, Property } from '@activepieces/pieces-framework';
import { toBuffer } from 'qrcode';

export const outputQrcodeAction = createAction({
  name: 'text_to_qrcode',
  displayName: 'Text to QR Code',
  description: 'Convert text to QR code',
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
