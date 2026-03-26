import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const voiceCallStarted = createOpplifyTrigger({
  name: 'voice_call_started',
  displayName: 'Voice Call Started',
  description: 'Triggers when an AI voice call begins with a lead via LiveKit.',
  eventType: 'voice_call_started',
  sampleData: SAMPLE_DATA.voice_call_started,
});
