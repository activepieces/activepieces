import { describe, expect, test } from 'vitest';
import { askFredInternals } from '../src/lib/actions/ai/ask-fred';

const EMPTY = {
  query: 'What did we decide?',
  meetingId: undefined,
  fromDate: undefined,
  toDate: undefined,
  organizers: undefined,
  participants: undefined,
  channelIds: undefined,
  meetingIds: undefined,
  responseLanguage: undefined,
  formatMode: undefined,
};

describe('ask_fred arguments', () => {
  test('a single meeting sends transcript_id and no filters', () => {
    const request = askFredInternals.buildAskFred({ ...EMPTY, meetingId: 'm-1' });
    expect(request.filterFields).toEqual([]);
    expect(request.values).toEqual({ query: 'What did we decide?', transcriptId: 'm-1', formatMode: 'markdown' });
  });

  test('filters are sent inside filters and without a meeting ID', () => {
    const request = askFredInternals.buildAskFred({ ...EMPTY, fromDate: '2026-03-01', participants: ['a@example.com'], meetingIds: ['m-1', 'm-2'], formatMode: 'plaintext' });
    expect(request.filterFields.map((spec) => spec.argument)).toEqual(['start_time', 'participants', 'transcript_ids']);
    expect(request.inputFields.map((spec) => spec.argument)).toEqual(['query', 'format_mode']);
    expect(request.values).toMatchObject({ startTime: '2026-03-01T00:00:00.000Z', participants: ['a@example.com'], transcriptIds: ['m-1', 'm-2'], formatMode: 'plaintext' });
  });

  test('refuses a meeting ID together with filters', () => {
    expect(() => askFredInternals.buildAskFred({ ...EMPTY, meetingId: 'm-1', channelIds: ['c-1'] })).toThrow('either Meeting ID or the filters');
    expect(() => askFredInternals.buildAskFred({ ...EMPTY, meetingId: 'm-1', toDate: '2026-03-01' })).toThrow('either Meeting ID or the filters');
  });

  test('enforces the 2000-character question limit and a required question', () => {
    expect(askFredInternals.buildAskFred({ ...EMPTY, query: 'q'.repeat(2000) }).values['query']).toHaveLength(2000);
    expect(() => askFredInternals.buildAskFred({ ...EMPTY, query: 'q'.repeat(2001) })).toThrow('at most 2000 characters');
    expect(() => askFredInternals.buildAskFred({ ...EMPTY, query: '   ' })).toThrow('Question is required');
  });

  test('rejects an unknown answer format', () => {
    expect(() => askFredInternals.buildAskFred({ ...EMPTY, formatMode: 'html' })).toThrow('Answer Format must be one of');
  });
});
