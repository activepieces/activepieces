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
//wraps arraybuffer in Buffer to work with heic-convert, which expects a Node.js Buffer.
    const buffer = Buffer.from(await response.arrayBuffer());
//50mb max file size for conversion
    const MAX_SIZE = 50 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      throw new Error('Image too large: maximum supported size is 50MB');
    }

    const sourceMimetype = detectHeifMimetype(buffer);

    //JPEG for library compatibility as library(heic-convert) expects JPEG, even if user selects PNG, as it can convert to PNG internally.
    const format = outputFormat === 'PNG' ? 'PNG' : 'JPEG';

    const outputBuffer = await convert({
      buffer,
      format,
      quality: 1,
    });
//output file conventionally require jpg not jpeg
    const extension = outputFormat === 'JPEG' ? 'jpg' : 'png';
//uploads converted file to AP internal file storage  
    const file = await context.files.write({
      //builds the output filename
      fileName: (resultFileName ?? 'image') + '.' + extension,
      //heic-convert returns a Buffer, which is compatible with AP's file storage API.
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
      //if file does not match any known value, defaults to 'image/heic' as it's the most common and widely supported HEIF variant. This ensures that even if detection fails, we still provide a reasonable default mimetype for HEIF files.
    default:
      return 'image/heic';
  }
}
