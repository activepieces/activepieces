import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { nuelinkClient } from '../../common/client';
import { nuelinkPosts } from '../../common/operations';
import { nuelinkOutputSchemas } from '../../output-schemas';

export const aiUploadFile = createAction({
  name: 'nuelink_upload_file',
  classification: 'WRITE',
  auth: nuelinkAuths,
  displayName: 'Upload Media File',
  description: 'Uploads one image, video or PDF to the brand\'s Nuelink media library and returns its media ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Uploads one JPG, PNG, BMP, MP4, MOV or PDF file (up to 100 MB) to the brand media library and returns a media ID for nuelink_create_post. Not needed when the file has a public URL (nuelink_create_post takes URLs) or is already in the library (nuelink_list_media). Each call stores a new copy that cannot be deleted through the API; after a timeout check nuelink_list_media before retrying.',
    idempotent: false,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
    file: Property.File({ displayName: 'File', description: 'A JPG, PNG, BMP, MP4, MOV or PDF file (URL or file reference), up to 100 MB.', required: true }),
  },
  outputSchema: nuelinkOutputSchemas.uploadMedia,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brandId, label: 'Brand ID' });
    return nuelinkPosts.upload({ apiKey, brandId, file: context.propsValue.file });
  },
});
