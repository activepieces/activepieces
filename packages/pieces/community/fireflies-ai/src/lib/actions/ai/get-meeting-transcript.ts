import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../../auth';
import { firefliesClient, FirefliesRecord } from '../../common/client';
import { firefliesInput, firefliesProps } from '../../common/props';
import { firefliesQueries } from '../../common/queries';
import { firefliesOutputSchemas } from '../../output-schemas';

export const getMeetingTranscriptAction = createAction({
  auth: firefliesAiAuth,
  name: 'get_meeting_transcript',
  classification: 'READ',
  displayName: 'Get Meeting Transcript',
  description: 'Gets the spoken sentences of one meeting, a page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets the transcript of one Fireflies meeting by ID as sentences with speaker name and start/end seconds, up to 2000 sentences per call. Page with offset/next_offset while has_more is true. Use Get Meeting Summary for a short version. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: firefliesOutputSchemas.getMeetingTranscript,
  props: {
    meeting_id: firefliesProps.meetingId({ description: 'The Fireflies meeting ID, for example from Find Meetings.' }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of sentences to skip. Default 0. Use next_offset from the previous call.',
      required: false,
    }),
    max_sentences: Property.Number({
      displayName: 'Max Sentences',
      description: 'Sentences to return, 1 to 2000. Default 500.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const meetingId = firefliesInput.requireText({ value: propsValue.meeting_id, label: 'Meeting ID' });
    const offset = firefliesInput.optionalInteger({ value: propsValue.offset, label: 'Offset', min: 0, max: 10_000_000 }) ?? 0;
    const maxSentences = firefliesInput.optionalInteger({ value: propsValue.max_sentences, label: 'Max Sentences', min: 1, max: MAX_SENTENCES }) ?? DEFAULT_SENTENCES;
    const data = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.getMeetingTranscript,
      variables: { transcriptId: meetingId },
      operation: `get the transcript of meeting ${meetingId}`,
    });
    const meeting = firefliesClient.requireEntity({
      data,
      key: 'transcript',
      notFound: `Meeting "${meetingId}" was not found, or the API key's user cannot access it.`,
    });
    return sliceTranscript({ meeting, meetingId, offset, maxSentences });
  },
});

function sliceTranscript({ meeting, meetingId, offset, maxSentences }: { meeting: FirefliesRecord; meetingId: string; offset: number; maxSentences: number }): FirefliesRecord {
  const all = firefliesClient.recordList(meeting['sentences']);
  const sentences = all.slice(offset, offset + maxSentences);
  const end = offset + sentences.length;
  const hasMore = end < all.length;
  return {
    id: meeting['id'] ?? meetingId,
    title: meeting['title'] ?? null,
    dateString: meeting['dateString'] ?? null,
    speakers: firefliesClient.recordList(meeting['speakers']),
    total_sentences: all.length,
    offset,
    returned: sentences.length,
    next_offset: hasMore ? end : null,
    has_more: hasMore,
    sentences,
  };
}

export const getMeetingTranscriptInternals = { sliceTranscript };

const DEFAULT_SENTENCES = 500;

const MAX_SENTENCES = 2000;
