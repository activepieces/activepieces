import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { saveBlogGallery } from '../api';
import { cmsAuth } from '../auth';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const saveBlogGalleryAction = createAction({
  name: 'save_blog_gallery',
  auth: cmsAuth,
  displayName: 'Save Blog Post Gallery Image',
  description: 'Save image to Total CMS blog post gallery',
  props: {
    slug: Property.ShortText({
      displayName: 'CMS ID',
      description: 'The CMS ID of the blog to save',
      required: true,
    }),
    permalink: Property.ShortText({
      displayName: 'Permalink',
      description: 'The permalink of the blog post to save',
      required: true,
    }),
    image: Property.File({
      displayName: 'Image',
      description: 'The image to save',
      required: true,
    }),
    alt: Property.ShortText({
      displayName: 'Alt Text',
      description: 'The alt text for the image',
      required: true,
    }),
    quality: Property.Number({
      displayName: 'Thumbnail Quality',
      description: 'The quality of the thumbnail',
      required: true,
      defaultValue: 85,
    }),
    scaleTh: Property.Number({
      displayName: 'Thumbnail Scale',
      description: 'The scale of the thumbnail',
      required: true,
      defaultValue: 400,
    }),
    scaleSq: Property.Number({
      displayName: 'Thumbnail Square Scale',
      description: 'The scale of the square thumbnail',
      required: true,
      defaultValue: 400,
    }),
    resize: Property.StaticDropdown({
      displayName: 'Thumbnail Resize Method',
      description: 'The method to use when resizing the thumbnail',
      required: true,
      defaultValue: 'auto',
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Landscape', value: 'landscape' },
          { label: 'Portrait', value: 'portrait' },
        ],
      },
    }),
    lcrop: Property.StaticDropdown({
      displayName: 'Thumbnail Landscape Crop',
      description:
        'The method to use when cropping the landscape thumbnail for the square thumbnail',
      required: true,
      defaultValue: 'center',
      options: {
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
        ],
      },
    }),
    pcrop: Property.StaticDropdown({
      displayName: 'Thumbnail Landscape Crop',
      description:
        'The method to use when cropping the landscape thumbnail for the square thumbnail',
      required: true,
      defaultValue: 'middle',
      options: {
        options: [
          { label: 'Top', value: 'top' },
          { label: 'Middle', value: 'middle' },
          { label: 'Bottom', value: 'bottom' },
        ],
      },
    }),
    altMeta: Property.Checkbox({
      displayName: 'Pull Alt Text from Meta Data',
      description:
        'Pull the alt text from the meta data of the image. If set, place placeholder text in the alt text field above.',
      required: true,
    }),
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      quality: z.number().min(1).max(100),
      scaleTh: z.number().min(1),
      scaleSq: z.number().min(1),
    });
    const slug = context.propsValue.slug;
    const image = {
      filename: context.propsValue.image.filename,
      base64: context.propsValue.image.base64,
    };
    return await saveBlogGallery(context.auth, slug, image, {
      permalink: context.propsValue.permalink,
      thumbs: 1,
      optimize: 1,
      alttype: context.propsValue.altMeta ? 'meta' : 'user',
      alt: context.propsValue.alt,
      quality: context.propsValue.quality,
      scale_th: context.propsValue.scaleTh,
      scale_sq: context.propsValue.scaleSq,
      resize: context.propsValue.resize,
      lcrop: context.propsValue.lcrop,
      pcrop: context.propsValue.pcrop,
    });
  },
});
