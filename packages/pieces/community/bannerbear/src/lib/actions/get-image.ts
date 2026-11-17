import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bannerbearAuth } from '../auth';
import { bannerbearClient, RawImage } from '../common/client';
import { bannerbearOutputSchemas } from '../output-schemas';

export const getImageAction = createAction({
  auth: bannerbearAuth,
  name: 'get_image',
  classification: 'READ',
  displayName: 'Get Image',
  description: 'Get an image and its status by ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch one Bannerbear image by its ID to read its status and file URLs. Use after a create action returned status "pending". Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: bannerbearOutputSchemas['image'],
  props: {
    image_uid: Property.ShortText({
      displayName: 'Image ID',
      description: 'The image UID returned by Create Image.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const uid = propsValue.image_uid.trim();
    if (uid === '') throw new Error('Image ID is required.');
    const raw = await bannerbearClient.request<RawImage>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: `/images/${encodeURIComponent(uid)}`,
    });
    return bannerbearClient.normalizeImage(raw);
  },
});
