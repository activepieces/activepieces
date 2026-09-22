import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';
import { prepareMediaFile } from '../../../common/prepare-file';
import { pollJob } from '../../../common/poll-job';
import { ConductorSendMessageResult, flattenSendMessageResult } from '../../../common/messaging';

export const postImageStatusAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_post_image_status',
  classification: 'WRITE',
  displayName: 'Post an Image Status',
  description: 'Post an image WhatsApp Status (story) with an optional caption.',
  audience: 'both',
  aiMetadata: { description: 'Posts an image WhatsApp Status update visible to your contacts for 24 hours, with an optional caption. This broadcasts to your status feed, not to a specific recipient; the post completes asynchronously. Takes either a directly downloadable image URL or a file from a previous step. Not idempotent: each call posts another status.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    imageUrl: Property.File({
      displayName: 'Image',
      description: 'A direct URL to the image, or a file from a previous step.',
      required: true,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'Optional caption for the status.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { session, imageUrl, caption } = context.propsValue;

    const preparedUrl = await prepareMediaFile({ apiKey: auth, file: imageUrl, files: context.files, mediaType: 'image' });

    const body: Record<string, unknown> = { session, file: preparedUrl };
    if (caption) body['caption'] = caption;

    const response = await whatsscaleClient(auth, HttpMethod.POST, '/api/status/image', body);
    const { jobId } = response.body as { jobId: string };
    const result = await pollJob(auth, jobId);
    return flattenSendMessageResult(result as ConductorSendMessageResult);
  },
});
