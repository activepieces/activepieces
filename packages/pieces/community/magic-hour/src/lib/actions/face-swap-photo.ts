import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { magicHourAuth } from '../auth';
import { magicHourApi } from '../common/client';

export const faceSwapPhotoAction = createAction({
  auth: magicHourAuth,
  name: 'face_swap_photo',
  classification: 'WRITE',
  displayName: 'Face Swap Photo',
  description: 'Start a photo face-swap job using source and target images.',
  audience: 'both',
  aiMetadata: {
    description:
      'Start a credit-consuming Magic Hour photo face swap using one source face for every detected face in the target. Inputs may be direct image URLs or Magic Hour file paths. Use Get Project with type Image for completion and downloads. Each retry starts another generation.',
    idempotent: false,
  },
  props: {
    target_file_path: Property.ShortText({
      displayName: 'Target Image',
      description:
        'Image whose detected faces will be replaced. Use a direct URL or Magic Hour file path.',
      required: true,
      placeholder: 'https://example.com/target.png',
    }),
    source_file_path: Property.ShortText({
      displayName: 'Source Face Image',
      description:
        'Image containing the replacement face. Use a direct URL or Magic Hour file path.',
      required: true,
      placeholder: 'https://example.com/source.png',
    }),
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'Optional name shown in the Magic Hour project list.',
      required: false,
      advanced: true,
    }),
  },
  async run(context) {
    return magicHourApi.call({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/face-swap-photo',
      body: {
        assets: {
          face_swap_mode: 'all-faces',
          target_file_path: context.propsValue.target_file_path,
          source_file_path: context.propsValue.source_file_path,
        },
        ...(context.propsValue.name
          ? { name: context.propsValue.name }
          : {}),
      },
    });
  },
});
