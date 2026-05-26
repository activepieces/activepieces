import { createAction, Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyClient } from '../common/client';
import { markyProps } from '../common/props';
import { markyUtils } from '../common/utils';

const uploadMediaAction = createAction({
  auth: markyAuth,
  name: 'upload-media',
  displayName: 'Upload Media',
  description:
    'Upload an image or video to a business media library. Supported: JPEG, PNG, WebP, GIF, MP4, MOV. Max 50 MB.',
  props: {
    businessId: markyProps.business(),
    file: Property.File({
      displayName: 'File',
      description: 'The image or video to upload.',
      required: true,
    }),
    altText: Property.ShortText({
      displayName: 'Alt Text',
      description: 'Optional alternative text describing the media.',
      required: false,
    }),
  },
  async run(context) {
    const businessId = markyUtils.getRequiredString({
      value: context.propsValue.businessId,
      fieldName: 'Business',
    });
    const altText = markyUtils.getOptionalString({
      value: context.propsValue.altText,
    });

    const file = context.propsValue.file;
    if (!file || typeof file.base64 !== 'string' || typeof file.filename !== 'string') {
      throw new Error('A valid file must be provided.');
    }

    const buffer = Buffer.from(file.base64, 'base64');

    const result = await markyClient.uploadMedia({
      apiKey: context.auth.secret_text,
      businessId,
      altText,
      file: buffer,
      filename: file.filename,
    });

    if (!result.ok) {
      throw new Error(`Failed to upload media: ${result.message}`);
    }

    return result.data;
  },
});

export { uploadMediaAction };
