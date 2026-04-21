import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';
import { prepareFile } from '../../common/prepare-file';
import { pollJob } from '../../common/poll-job';

export const sendVideoToCrmContactAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_video_to_crm_contact',
  displayName: 'Send a Video to a CRM Contact',
  description: 'Send a video to a WhatsScale CRM contact selected from the dropdown.',
  props: {
    session: whatsscaleProps.session,
    crmContact: whatsscaleProps.crmContact,
    videoUrl: Property.ShortText({
      displayName: 'Video URL',
      description: 'Direct URL to the video file.',
      required: true,
    }),
    caption: Property.ShortText({
      displayName: 'Caption',
      description: 'Optional caption for the video (max 1024 characters).',
      required: false,
    }),
  },
  async run(context) {
    const { session, crmContact, videoUrl, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareFile(apiKey, videoUrl);

    const sendResponse = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendVideo', {
      session,
      contact_type: 'crm_contact',
      crm_contact_id: crmContact,
      file: preparedUrl,
      caption: caption ?? '',
    });

    const { jobId } = sendResponse.body as { jobId: string };
    return await pollJob(apiKey, jobId);
  },
});
