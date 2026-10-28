import { callsyncWebhookTrigger } from '../common/webhook-trigger';
import { callLoggedSample } from '../common/samples';

export const newCall = callsyncWebhookTrigger({
  name: 'new_call',
  displayName: 'New Call',
  description: 'Triggers when a call syncs from a team member\'s phone.',
  aiDescription:
    'Fires for each business call (incoming, outgoing, missed or rejected) as soon as it syncs from a team member\'s phone to CallSync, with caller, team member and call details.',
  event: 'call_logged',
  sampleData: callLoggedSample,
});
