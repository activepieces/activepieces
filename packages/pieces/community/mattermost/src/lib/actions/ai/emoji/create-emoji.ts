import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostApi } from '../../../common/api';
import { mattermostClient } from '../../../common/client';
import { mattermostCreateEmojiOutputSchema } from '../../../output-schemas';

export const createEmojiAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_create_emoji',
  outputSchema: mattermostCreateEmojiOutputSchema,
  displayName: 'Create Custom Emoji',
  description: 'Uploads an image as a custom emoji.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads an image (GIF, PNG or JPEG, up to 512 KB) as a custom emoji with the given name. Needs custom emoji enabled on the server. Not idempotent: a taken name fails.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Emoji name without colons: lowercase letters, numbers, "-", "+" and "_", e.g. "party_parrot".',
      required: true,
    }),
    image: Property.File({
      displayName: 'Image',
      description: 'GIF, PNG or JPEG image, up to 512 KB.',
      required: true,
    }),
  },
  async run(context) {
    const { name, image } = context.propsValue;
    const me = await mattermostApi.getMe({ auth: context.auth });
    const form = new FormData();
    form.append('image', new Blob([new Uint8Array(image.data)]), image.filename);
    form.append('emoji', JSON.stringify({ name, creator_id: me.id }));
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/emoji',
      body: form,
    });
  },
});
