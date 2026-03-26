import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const callTranscriptAvailable = createOpplifyTrigger({
  name: 'call_transcript_available',
  displayName: 'Call Transcript Available',
  description: 'Triggers when a voice call transcript is ready after speech-to-text processing.',
  eventType: 'call_transcript_available',
  sampleData: SAMPLE_DATA.call_transcript_available,
});
