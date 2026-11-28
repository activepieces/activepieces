import { describe, expect, test } from 'vitest';
import { getMeetingTranscriptInternals } from '../src/lib/actions/ai/get-meeting-transcript';

const MEETING = {
  id: 'm-1',
  title: 'Weekly sync',
  dateString: '2026-03-15T14:00:00.000Z',
  speakers: [{ id: '0', name: 'Alex' }],
  sentences: Array.from({ length: 7 }, (_, index) => ({ index, text: `Sentence ${index}`, speaker_name: 'Alex', start_time: index, end_time: index + 1 })),
};

describe('get_meeting_transcript slicing', () => {
  test('returns the first page and points at the next offset', () => {
    const output = getMeetingTranscriptInternals.sliceTranscript({ meeting: MEETING, meetingId: 'm-1', offset: 0, maxSentences: 3 });
    expect(output).toMatchObject({ total_sentences: 7, offset: 0, returned: 3, next_offset: 3, has_more: true });
    expect(output['sentences']).toEqual(MEETING.sentences.slice(0, 3));
  });

  test('the last page has no next offset', () => {
    const output = getMeetingTranscriptInternals.sliceTranscript({ meeting: MEETING, meetingId: 'm-1', offset: 6, maxSentences: 3 });
    expect(output).toMatchObject({ returned: 1, next_offset: null, has_more: false });
  });

  test('an offset past the end returns nothing and no next page', () => {
    const output = getMeetingTranscriptInternals.sliceTranscript({ meeting: MEETING, meetingId: 'm-1', offset: 50, maxSentences: 3 });
    expect(output).toMatchObject({ total_sentences: 7, returned: 0, next_offset: null, has_more: false, sentences: [] });
  });

  test('a meeting with no sentences yet reports zero', () => {
    const output = getMeetingTranscriptInternals.sliceTranscript({ meeting: { id: 'm-2', sentences: null }, meetingId: 'm-2', offset: 0, maxSentences: 500 });
    expect(output).toMatchObject({ id: 'm-2', total_sentences: 0, returned: 0, has_more: false, speakers: [] });
  });
});
