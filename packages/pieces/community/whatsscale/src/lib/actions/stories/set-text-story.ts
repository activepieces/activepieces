import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';
import { pollJob } from '../../common/poll-job';

export const setTextStoryAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_set_text_story',
  displayName: 'Set a Text Story',
  description: 'Post a text status update to your WhatsApp story',
  props: {
    session: whatsscaleProps.session,
    text: Property.ShortText({
      displayName: 'Story Text',
      required: true,
      description: 'Text to display in your WhatsApp story',
    }),
    backgroundColor: Property.ShortText({
      displayName: 'Background Color',
      required: false,
      description: 'Hex color code (e.g. #25D366 for WhatsApp green)',
    }),
  },
  async run(context) {
    const { session, text, backgroundColor } = context.propsValue;
    const auth = context.auth.secret_text;

    const body: Record<string, unknown> = { session, text };
    if (backgroundColor) body.backgroundColor = backgroundColor;

    const response = await whatsscaleClient(
      auth,
      HttpMethod.POST,
      '/api/status/text',
      { ...body, platform: 'activepieces' },
    );

    const { jobId } = response.body as { jobId: string };
    return await pollJob(auth, jobId);
  },
});
