import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { cloudinaryExplodeResourceOutputSchema } from '../../output-schemas';

export const cloudinaryExplodeResource = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_explode_resource',
  outputSchema: cloudinaryExplodeResourceOutputSchema,
  displayName: 'Explode Multi-Page Resource',
  description: 'Creates one derived image per page of a PDF or frame of an animated image.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Asynchronously generates a separate derived image for every page of a multi-page PDF or every frame of an animated GIF/WebP. The transformation must contain "pg_all" (default). Returns status "processing" and a batch_id; the derived images then appear in Get Resource\'s derived list.',
    idempotent: true,
  },
  props: {
    public_id: Property.ShortText({ displayName: 'Public ID', description: 'Public ID of the PDF or animated image.', required: true }),
    type: aiProps.deliveryType(),
    transformation: Property.ShortText({ displayName: 'Transformation', description: 'Must include pg_all. Defaults to "pg_all".', required: false }),
    format: Property.ShortText({ displayName: 'Format', description: 'Output format of each page (e.g. "png", "jpg").', required: false }),
    notification_url: Property.ShortText({ displayName: 'Notification URL', description: 'Webhook URL called when done.', required: false }),
  },
  async run({ auth, propsValue }) {
    const transformation = propsValue.transformation?.trim() || 'pg_all';
    if (!transformation.includes('pg_all')) {
      throw new Error('The transformation must include pg_all.');
    }
    return makeRequest(auth, HttpMethod.POST, '/image/explode', {
      public_id: propsValue.public_id.trim(),
      type: propsValue.type ?? 'upload',
      transformation,
      ...(propsValue.format ? { format: propsValue.format.trim() } : {}),
      ...(propsValue.notification_url ? { notification_url: propsValue.notification_url.trim() } : {}),
    });
  },
});
