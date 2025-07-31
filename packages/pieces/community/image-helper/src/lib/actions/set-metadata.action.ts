import { Property, createAction } from '@activepieces/pieces-framework';
import jimp from 'jimp';
import exiftool from 'node-exiftool';

export const setMetaData = createAction({
  name: 'set_meta_data',
  description: 'Sets metadata to an image',
  displayName: 'Set image metadata',
  props: {
    image: Property.File({
      displayName: 'Image',
      required: true,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      required: true,
    }),
    resultFileName: Property.ShortText({
      displayName: 'Result File Name',
      description:
        'Specifies the output file name for the result image (without extension).',
      required: false,
    }),
  },
  async run(context) {
    const image = await jimp.read(context.propsValue.image.data);
    const fileName =
      (context.propsValue.resultFileName ?? 'image') +
      '.' +
      image.getExtension();
    const imageBuffer = await image.getBufferAsync(image.getMIME());
    const imageReference = await context.files.write({
      fileName: fileName,
      data: imageBuffer,
    });

    const exifProcess = new exiftool.ExiftoolProcess();
    await exifProcess.open();
    await exifProcess.writeMetadata(fileName, context.propsValue.metadata);

    await exifProcess.close();

    return imageReference;
  },
});
