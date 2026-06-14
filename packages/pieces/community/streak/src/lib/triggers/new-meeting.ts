import { createPipelineWebhookTrigger } from '../common/trigger-factory';

export const newMeetingTrigger = createPipelineWebhookTrigger({
  name: 'new_meeting_or_call_log',
  displayName: 'New Meeting or Call Log',
  description:
    'Triggers when a meeting note or call log is created on a box in the selected pipeline.',
  aiMetadata: {
    description:
      'Fires when a new meeting note or call log is created on a box in the selected pipeline, representing a logged interaction (such as a discovery call) on a CRM record.',
  },
  event: 'MEETING_CREATE',
  sampleData: {
    key: 'agxzfm1haWxmb29nYWVyMQsSB01lZXRpbmcYgICAwI_oogow',
    boxKey: 'agxzfm1haWxmb29nYWVyMQsSA0JveBiAgIDAj-iiCgw',
    name: 'Discovery call',
    notes: 'Discussed pricing and integration timeline.',
    timestamp: 1714080000000,
  },
});
