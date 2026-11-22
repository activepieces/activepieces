import {
  HttpMethod,
  propsValidation,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini'
import { joggAiAuth } from '../..';
import { joggAiClient } from '../common/client';
import { joggAiOutputSchemas } from '../common/output-schemas';

export const uploadMedia = createAction({
  name: 'uploadMedia',
  classification: 'WRITE',
  displayName: 'Upload Media',
  description:
    'Generate a signed URL for file upload. PUT your file to the returned sign_url with header Content-Type: application/octet-stream, then use the returned asset_id (a JoggAI-hosted URL) as a media URL.',
  audience: 'both',
  outputSchema: joggAiOutputSchemas.uploadMedia,
  aiMetadata: {
    description:
      'Requests a signed upload URL from JoggAI for a given filename (must include a file extension and no special characters); the caller then PUTs the file bytes to the returned sign_url with header Content-Type: application/octet-stream (any other content type, or none, fails with 403 SignatureDoesNotMatch). After upload, data.asset_id is the JoggAI-hosted file URL to pass as a media URL to product actions such as Create Product. Use as the first step to get media into JoggAI before referencing it in product or video actions. Not idempotent: each call mints a new signed upload target.',
    idempotent: false,
  },
  auth: joggAiAuth,
  props: {
    filename: Property.ShortText({
      displayName: 'Filename',
      description:
        'Name of the file to upload with extension (e.g., "image.jpg", "video.mp4")',
      required: true,
    }),
  },

  async run({ auth, propsValue }) {
    const { filename } = propsValue;

    await propsValidation.validateZod(propsValue, {
      filename: z.string().check(z.minLength(1, 'Filename cannot be empty'), z.regex(/^[^/\\:*?"<>|]+\.[a-zA-Z0-9]+$/, 'Filename must include a file extension and contain no special characters')),
    });

    return joggAiClient.requestEnvelope({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/upload/asset',
      op: 'upload media',
      body: {
        filename,
      },
    });
  },
});
