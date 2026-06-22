import { Property, createAction } from '@activepieces/pieces-framework';
import convert from 'heic-convert';
import sharp from 'sharp';
import jimp from 'jimp';
import * as mime from 'mime-types';

const MAX_PIXELS = 100_000_000;

export const convertHeif = createAction({
  name: 'convert_heif',
  displayName: 'Image Conversion Helper',
  description: 'Converts a image to supported formats',
  props: {
    image: Property.File({
      displayName: 'Image',
      required: true,
    }),
    outputFormat: Property.StaticDropdown({
      displayName: 'Output Format',
      description: 'The format to convert the image to.',
      required: true,
      options: {
        options: [
          { label: 'JPEG', value: 'JPEG' },
          { label: 'PNG', value: 'PNG' },
          { label: 'TIFF', value: 'TIFF' },
          { label: 'BMP', value: 'BMP' },
          { label: 'AVIF', value: 'AVIF' },
        ],
      },
    }),
    resultFileName: Property.ShortText({
      displayName: 'Result File Name',
      description:
        'Specifies the output file name for the result image (without extension).',
      required: false,
    }),
  },
  async run(context) {
    const { image, outputFormat, resultFileName } = context.propsValue;

    const sourceMimetype = image.extension
      ? mime.lookup(image.extension) || 'application/octet-stream'
      : mime.lookup(image.filename || '') || 'application/octet-stream';

    const extensionMap: Record<string, string> = {
      JPEG: 'jpg',
      PNG: 'png',
      TIFF: 'tiff',
      BMP: 'bmp',
      AVIF: 'avif',
    };
    const extension = extensionMap[outputFormat] ?? 'jpg';

    const isHeic =
      sourceMimetype === 'image/heic' || sourceMimetype === 'image/heif';

    // heic-convert decodes HEIC/HEIF; for everything else pass the buffer directly
    const decodedBuffer: Buffer = isHeic
      ? Buffer.from(await convert({ buffer: image.data, format: 'JPEG', quality: 1 }))
      : Buffer.isBuffer(image.data) ? image.data : Buffer.from(image.data);

    const metadata = await sharp(decodedBuffer).metadata();
    if ((metadata.width ?? 0) * (metadata.height ?? 0) > MAX_PIXELS) {
      throw new Error('Image exceeds the maximum allowed dimensions (100 megapixels)');
    }

    let outputData: Buffer;

    if (outputFormat === 'AVIF') {
      outputData = await sharp(decodedBuffer).avif().toBuffer();
    } else if (outputFormat === 'BMP') {
      const jimpImage = await jimp.read(decodedBuffer);
      outputData = await jimpImage.getBufferAsync(jimp.MIME_BMP);
    } else {
      const jimpMimeMap: Record<string, string> = {
        JPEG: jimp.MIME_JPEG,
        PNG: jimp.MIME_PNG,
        TIFF: jimp.MIME_TIFF,
      };
      const jimpImage = await jimp.read(decodedBuffer);
      outputData = await jimpImage.getBufferAsync(jimpMimeMap[outputFormat] ?? jimp.MIME_JPEG);
    }

    const file = await context.files.write({
      fileName: (resultFileName ?? 'image') + '.' + extension,
      data: outputData,
    });

    return { file, sourceMimetype };
  },
});
