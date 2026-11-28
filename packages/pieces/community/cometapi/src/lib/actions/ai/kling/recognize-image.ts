import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiClient } from '../../../common/client';
import { cometapiKlingRecognizeImageOutputSchema } from '../../../output-schemas';

export const klingRecognizeImageAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_recognize_image',
  outputSchema: cometapiKlingRecognizeImageOutputSchema,
  displayName: 'Kling Recognize Image',
  description:
    'Checks which regions (head, face, cloth, object) Kling finds in an image.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Runs Kling image recognition synchronously and returns flags for regions such as head_seg, face_seg, cloth_seg and object_seg, to check whether an image suits Kling Create Avatar Video, virtual try-on or other asset-driven actions before a billed generation. No task to poll.',
    idempotent: true,
  },
  props: {
    image: Property.ShortText({
      displayName: 'Image',
      description:
        'Public JPG/PNG URL or raw base64 (no data: prefix), up to 10 MB, 300 px or more per side.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/videos/image-recognize',
      body: { image: propsValue.image },
    });
  },
});
