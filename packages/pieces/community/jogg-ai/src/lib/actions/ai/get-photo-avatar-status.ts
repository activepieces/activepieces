import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { joggAiAuth } from '../../..';
import { joggAiClient } from '../../common/client';
import { joggAiOutputSchemas } from '../../common/output-schemas';

export const aiGetPhotoAvatarStatus = createAction({
  auth: joggAiAuth,
  name: 'ai_get_photo_avatar_status',
  displayName: 'Get Photo Avatar Status',
  description: 'Gets the status and images of a photo avatar generation.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: joggAiOutputSchemas.aiGetPhotoAvatarStatus,
  aiMetadata: {
    description:
      'Gets the status of a photo avatar generation started with Create Photo Avatar, by its photo_id. Status is in_progress, success or error; image_url_list and image_key_list can still be null right after status becomes success, because the images may need the motion or selection step in JoggAI. Read-only.',
    idempotent: true,
  },
  props: {
    photo_id: Property.ShortText({
      displayName: 'Photo ID',
      description: 'The photo_id returned by Create Photo Avatar.',
      required: true,
    }),
  },
  async run(context) {
    const photoId = context.propsValue.photo_id.trim();
    if (!photoId) {
      throw new Error('Photo ID is required.');
    }
    return joggAiClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/photo_avatar/photo',
      op: 'get photo avatar status',
      queryParams: { photo_id: photoId },
    });
  },
});
