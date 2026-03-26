import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const voiceCallEnded = createOpplifyTrigger({
  name: 'voice_call_ended',
  displayName: 'Voice Call Ended',
  description: 'Triggers when an AI voice call ends. Includes call duration and status.',
  eventType: 'voice_call_ended',
  sampleData: SAMPLE_DATA.voice_call_ended,
});
