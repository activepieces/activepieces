import {
  createAction,
  Property,
} from '@activepieces/pieces-framework'
import { assertNotNullOrUndefined } from '@activepieces/shared';
import { text } from '../common/props';
import { toBuffer } from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

enum ImageOutputFormat {
  MEMORY = 'memory',
  BASE64_DATA_URI = 'base64_data_uri',
  PNG_BUFFER = 'png_buffer',
}

export const outputQrcodeAction = createAction({
  name: 'text_to_qrcode',
  displayName: 'Text to QR Code',
  description: 'Convert text to QR code',
  props: {
    text,
    qrcodeOutputFormat: Property.StaticDropdown<ImageOutputFormat>({
      displayName: 'Output format',
      required: true,
      defaultValue: ImageOutputFormat.MEMORY,
      options: {
        disabled: false,
        options: [
          { label: 'memory://', value: ImageOutputFormat.MEMORY },
          { label: 'Base64 data URI', value: ImageOutputFormat.BASE64_DATA_URI },
          { label: 'Buffer (PNG)', value: ImageOutputFormat.PNG_BUFFER },
        ],
      },
    }),
  },
  async run(context) {
    const { text, qrcodeOutputFormat } = context.propsValue

    assertNotNullOrUndefined(text, 'text')

    const qrcodeBuffer = await toBuffer(text);

    switch (qrcodeOutputFormat) {
      case ImageOutputFormat.MEMORY:
        return 'memory://' + JSON.stringify({
          fileName: `${uuidv4()}.png`,
          data: qrcodeBuffer.toString('base64'),
        });
      case ImageOutputFormat.BASE64_DATA_URI:
        return 'data:image/png;base64,' + qrcodeBuffer.toString('base64');
      case ImageOutputFormat.PNG_BUFFER:
        return qrcodeBuffer;
      default:
        throw new Error(`Unsupported output format: ${qrcodeOutputFormat}`);        
    }
  },
})
