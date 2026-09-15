import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { ConductorSendMessageResult, flattenSendMessageResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { prepareMediaFile } from '../../../common/prepare-file';
import { pollJob } from '../../../common/poll-job';

export const sendVideoToCrmContactAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_video_to_crm_contact',
  classification: 'WRITE',
  displayName: 'Send a Video to a CRM Contact',
  description: 'Send a video to a WhatsScale CRM contact selected from the dropdown.',
  audience: 'human',
  aiMetadata: { description: 'Sends a video to a contact stored in the WhatsScale CRM, identified by CRM contact ID chosen from the dropdown, with an optional caption. Pick this when the recipient is a managed CRM record; use the plain contact, group, manual-entry, or channel video variants for non-CRM recipients. Takes either a directly downloadable video URL or a file from a previous step. Not idempotent: each call delivers another video.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    crmContact: whatsscaleProps.crmContact,
    videoUrl: Property.File({
      displayName: 'Video',
      description: 'A direct URL to the video, or a file from a previous step.',
      required: true,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'Optional caption for the video (max 1024 characters).',
      required: false,
    }),
  },
  propertyGroups: [
    { key: 'destination', display: 'section' as const, label: 'Destination', icon: 'send', props: ['session', 'crmContact'] },
    { key: 'content', display: 'section' as const, label: 'Video', icon: 'paperclip', props: ['videoUrl', 'caption'] },
  ],
  async run(context) {
    const { session, crmContact, videoUrl, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareMediaFile({ apiKey, file: videoUrl, files: context.files, mediaType: 'video' });

    const sendResponse = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendVideo', {
      session,
      contact_type: 'crm_contact',
      crm_contact_id: crmContact,
      file: preparedUrl,
      caption: caption ?? '',
    });

    const { jobId } = sendResponse.body as { jobId: string };
    const result = await pollJob(apiKey, jobId);
    return flattenSendMessageResult(result as ConductorSendMessageResult);
  },
});
