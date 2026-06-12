import { Property, createAction } from '@activepieces/pieces-framework';
import convert from 'heic-convert';

export const convertsHeif = createAction({
  name: 'converts_heif',
  displayName: 'Convert HEIF/HEIC Image',
  description: 'Converts a HEIF/HEIC image to another format',
  props: {
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'URL of the HEIF/HEIC image to convert. Paste the file URL from a previous step or any direct link to a .heic / .heif file.',
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
    const { imageUrl, outputFormat, resultFileName } = context.propsValue;

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());

    const sourceMimetype = detectHeifMimetype(buffer);
    const format = outputFormat === 'PNG' ? 'PNG' : 'JPEG';

    const outputBuffer = await convert({
      buffer,
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
  // HEIF box layout: [0-3] size, [4-7] "ftyp", [8-11] major brand
  const brand = buffer.toString('ascii', 8, 12);
  switch (brand) {
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
