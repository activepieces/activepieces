import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

const FORMATS: Record<string, string> = {
  vtt: 'text/vtt',
  text: 'application/vnd.microsoft.graph.transcript+text',
};

export const getMeetingTranscriptContent = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_meeting_transcript_content',
  displayName: 'Get Meeting Transcript Content',
  description: 'Gets the text of a meeting transcript.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the full text of one transcript of an online meeting the signed-in user organized, as WebVTT with speaker names (vtt) or as plain text without speakers (text). If vtt fails with SpeakerAttributionNotAllowed, call again with text. Transcript IDs come from List Meeting Transcripts.',
    idempotent: true,
  },
  props: {
    meetingId: microsoftTeamsAiProps.meetingId({ required: true }),
    transcriptId: Property.ShortText({
      displayName: 'Transcript ID',
      description: 'The transcript ID, from List Meeting Transcripts.',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'vtt: WebVTT with timestamps and speaker names (default). text: plain text without speaker names.',
      required: false,
      defaultValue: 'vtt',
      options: {
        disabled: false,
        options: [
          { label: 'WebVTT with speakers', value: 'vtt' },
          { label: 'Plain text', value: 'text' },
        ],
      },
    }),
  },
  async run(context) {
    const { meetingId, transcriptId, format } = context.propsValue;
    const accept = FORMATS[format ?? 'vtt'];
    if (!accept) {
      throw new Error(`Format must be one of: ${Object.keys(FORMATS).join(', ')}.`);
    }
    const content = await microsoftTeamsClient.getText({
      auth: context.auth,
      path: `/me/onlineMeetings/${meetingId}/transcripts/${transcriptId}/content`,
      accept,
    });
    return { transcriptId, format: format ?? 'vtt', content };
  },
});
