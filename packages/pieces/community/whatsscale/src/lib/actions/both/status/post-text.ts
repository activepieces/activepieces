import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';
import { pollJob } from '../../../common/poll-job';
import { ConductorSendMessageResult, flattenSendMessageResult } from '../../../common/messaging';

export const postTextStatusAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_post_text_status',
  classification: 'WRITE',
  displayName: 'Post a Text Status',
  description: 'Post a text-only WhatsApp Status (story) with an optional background color.',
  audience: 'both',
  aiMetadata: { description: 'Posts a text-only WhatsApp Status update visible to your contacts for 24 hours, with an optional background color (hex, defaults to WhatsApp green). This broadcasts to your status feed, not to a specific recipient; the post completes asynchronously. Not idempotent: each call posts another status.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    text: Property.LongText({
      displayName: 'Text',
      description: 'The status text to post.',
      required: true,
    }),
    backgroundColor: Property.Color({
      displayName: 'Background Color',
      description: 'Leave empty for the default WhatsApp green.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { session, text, backgroundColor } = context.propsValue;

    const body: Record<string, unknown> = { session, text };
    if (backgroundColor) body['backgroundColor'] = backgroundColor;

    const response = await whatsscaleClient(auth, HttpMethod.POST, '/api/status/text', body);
    const { jobId } = response.body as { jobId: string };
    const result = await pollJob(auth, jobId);
    return flattenSendMessageResult(result as ConductorSendMessageResult);
  },
});
