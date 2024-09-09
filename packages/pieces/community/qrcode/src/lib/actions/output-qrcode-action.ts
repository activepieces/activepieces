import { createAction } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/shared';
import { text } from '../common/props';
import { toBuffer } from 'qrcode';

export const outputQrcodeAction = createAction({
  name: 'text_to_qrcode',
  displayName: 'Text to QR Code',
  description: 'Convert text to QR code',
  props: {
    text,
  },
  async run(context) {
    const { text } = context.propsValue;

    assertNotNullOrUndefined(text, 'text');

    const qrcodeBuffer = await toBuffer(text);

    return await context.files.write({
      fileName: 'qr-code.png',
      data: qrcodeBuffer,
    });
  },
});
