import { Property, createAction } from '@activepieces/pieces-framework';
import convert from 'heic-convert';
import sharp from 'sharp';
import jimp from 'jimp';
import * as mime from 'mime-types';

export const convertImageFormat = createAction({
  name: 'convert_image_format',
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
      description: 'Specifies the output file name for the result image (without extension).',
      required: false,
    }),
  },
  async run(context) {
    const { image, outputFormat, resultFileName } = context.propsValue;

    const sourceMimetype = image.extension
      ? mime.lookup(image.extension) || 'application/octet-stream'
      : mime.lookup(image.filename || '') || 'application/octet-stream';

    let inputData: Buffer;

    switch (sourceMimetype) {
      case 'image/heic':
      case 'image/heif':
        inputData = Buffer.from(await convert({ buffer: image.data, format: 'JPEG', quality: 1 }));
        break;
      default:
        inputData = Buffer.isBuffer(image.data) ? image.data : Buffer.from(image.data);
    }

    let outputData: Buffer;
    let outputFileName: string;

    switch (outputFormat) {
      case 'AVIF':
        outputData = await sharp(inputData).avif().toBuffer();
        outputFileName = (resultFileName ?? 'image') + '.avif';
        break;
      case 'JPEG': {
        const jimpImage = await jimp.read(inputData);
        outputData = await jimpImage.getBufferAsync(jimp.MIME_JPEG);
        outputFileName = (resultFileName ?? 'image') + '.jpg';
        break;
      }
      case 'PNG': {
        const jimpImage = await jimp.read(inputData);
        outputData = await jimpImage.getBufferAsync(jimp.MIME_PNG);
        outputFileName = (resultFileName ?? 'image') + '.png';
        break;
      }
      case 'TIFF': {
        const jimpImage = await jimp.read(inputData);
        outputData = await jimpImage.getBufferAsync(jimp.MIME_TIFF);
        outputFileName = (resultFileName ?? 'image') + '.tiff';
        break;
      }
      case 'BMP': {
        const jimpImage = await jimp.read(inputData);
        outputData = await jimpImage.getBufferAsync(jimp.MIME_BMP);
        outputFileName = (resultFileName ?? 'image') + '.bmp';
        break;
      }
      default:
        throw new Error(`Unsupported output format: ${outputFormat}`);
    }

    const file = await context.files.write({
      fileName: outputFileName,
      data: outputData,
    });

    return { file, sourceMimetype };
  },
});
