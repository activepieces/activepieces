import { Property, createAction } from '@activepieces/pieces-framework';
import jimp from 'jimp';

export const compressImage = createAction({
  name: 'compress_image',
  description: 'Compresses an image',
  displayName: 'Compresses an image',
  props: {
    image: Property.File({
      displayName: 'Image',
      required: true,
    }),
    quality: Property.StaticDropdown({
      displayName: 'Quality',
      description: 'Specifies the quality of the image after compression (0-100).',
      required: true,
      options: {
        options:[
          {label: 'High Quality', value: 90},
          {label: 'Lossy Quality', value: 60}
        ]
      }
    }),
  },
  async run(context) {
    const image = await jimp.read(context.propsValue.image.data);
    
    image.quality(context.propsValue.quality);
    
    const imageBuffer = await image.getBufferAsync(image.getMIME());

    const imageReference = await context.files.write({
      fileName: 'image.' + image.getExtension(),
      data: imageBuffer
    });

    return imageReference;
  },
});