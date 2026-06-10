import { Property, createAction } from '@activepieces/pieces-framework';
import convert from 'heic-convert';

export const convertsHeif = createAction({
  name: 'converts_heif',
  displayName: 'Convert HEIF/HEIC Image',
  description: 'Converts a HEIF/HEIC image to another format',
  props: {
    image: Property.File({
      displayName: 'Image',
      description: 'The HEIF/HEIC image to convert.',
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
        ],
      },
    }),
    resultFileName: Property.ShortText({
      displayName: 'Result File Name',
      description: 'The output file name without extension.',
      required: false,
    }),
  },
  async run(context) {
    const { image, outputFormat, resultFileName } = context.propsValue;

    const sourceMimetype = detectHeifMimetype(image.data);

    const format = outputFormat === 'PNG' ? 'PNG' : 'JPEG';

    const outputBuffer = await convert({
      buffer: image.data,
      format,
      quality: 1,
    });

    const extension = outputFormat === 'JPEG' ? 'jpg' : 'png';
    const file = await context.files.write({
      fileName: (resultFileName ?? 'image') + '.' + extension,
      data: Buffer.from(outputBuffer),
    });

    return { file, sourceMimetype };
  },
});

function detectHeifMimetype(buffer: Buffer): string {
  // HEIF/HEIC files have an `ftyp` box at bytes 4–8
  const ftyp = buffer.toString('ascii', 4, 8);
  switch (ftyp) {
    case 'heic':
    case 'heix':
      return 'image/heic';
    case 'hevc':
    case 'hevx':
    case 'mif1':
    case 'msf1':
      return 'image/heif';
    default:
      return 'image/heic';
  }
}
