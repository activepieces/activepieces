import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryCreateMultiResourceOutputSchema } from '../../output-schemas';

export const cloudinaryCreateMultiResource = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_create_multi_resource',
  outputSchema: cloudinaryCreateMultiResourceOutputSchema,
  displayName: 'Create Animation from Images',
  description: 'Combines images into an animated GIF, a video or a multi-page PDF.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Combines all images carrying a tag (in public ID order), or an ordered list of image URLs, into one animated image, video or PDF. Set Format to gif, webp, mp4 or pdf, and optionally a transformation such as "dl_200" for frame delay. Returns the new asset\'s URL. Not idempotent.',
    idempotent: false,
  },
  props: {
    tag: Property.ShortText({ displayName: 'Tag', description: 'Combine all images with this tag. Use either this or URLs.', required: false }),
    urls: Property.Array({ displayName: 'Image URLs', description: 'Ordered Cloudinary delivery URLs of the images. Use either this or Tag.', required: false }),
    format: Property.StaticDropdown({
      displayName: 'Output Format',
      description: 'The output file type. Defaults to gif.',
      required: false,
      defaultValue: 'gif',
      options: { options: ['gif', 'webp', 'png', 'mp4', 'webm', 'pdf'].map((value) => ({ label: value, value })) },
    }),
    transformation: Property.ShortText({ displayName: 'Transformation', description: 'Transformation applied to each frame (e.g. "c_fill,w_400,h_400/dl_200").', required: false }),
    async: aiProps.includeFlag({ displayName: 'Process Asynchronously', description: 'Return immediately and generate in the background.' }),
  },
  async run({ auth, propsValue }) {
    const tag = propsValue.tag?.trim();
    const urls = aiResults.cleanArray({ values: propsValue.urls });
    if (Boolean(tag) === urls.length > 0) {
      throw new Error('Provide either Tag or Image URLs, not both.');
    }
    const formatSegment = `f_${propsValue.format ?? 'gif'}`;
    const body = {
      ...(tag ? { tag } : { urls }),
      transformation: propsValue.transformation ? `${propsValue.transformation.trim()}/${formatSegment}` : formatSegment,
      ...(propsValue.async ? { async: true } : {}),
    };
    return makeRequest(auth, HttpMethod.POST, '/image/multi', body);
  },
});
