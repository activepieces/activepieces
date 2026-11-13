import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../auth';
import { nuelinkClient } from '../common/client';
import { nuelinkPosts } from '../common/operations';
import { nuelinkProps } from '../common/props';
import { nuelinkOutputSchemas } from '../output-schemas';

export const uploadMedia = createAction({
  name: 'upload_media',
  classification: 'WRITE',
  auth: nuelinkAuths,
  displayName: 'Upload Media',
  description: 'Uploads an image, video or PDF to the brand\'s Nuelink media library and returns its media ID for Create Post in Collection.',
  audience: 'human',
  aiMetadata: {
    description:
      'Uploads one image, video or PDF (jpg, jpeg, png, bmp, mp4, mov, pdf; up to 100 MB) to the brand\'s Nuelink media library and returns its media ID for Create Post in Collection. Not needed when the file already has a public URL, since Create Post in Collection accepts URLs directly. Each call stores a new copy.',
    idempotent: false,
  },
  props: {
    brand: nuelinkProps.brand(),
    file: Property.File({
      displayName: 'File',
      description: 'A JPG, PNG, BMP, MP4, MOV or PDF file, up to 100 MB.',
      required: true,
    }),
  },
  outputSchema: nuelinkOutputSchemas.uploadMedia,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brand, label: 'Brand' });
    return nuelinkPosts.upload({ apiKey, brandId, file: context.propsValue.file });
  },
});
