import { describe, expect, test } from 'vitest';
import { firefliesQueries } from '../src/lib/common/queries';
import { askFredInternals } from '../src/lib/actions/ai/ask-fred';

describe('GraphQL variable types match the live Fireflies schema', () => {
  test('ID! inputs are declared as ID!, not String!', () => {
    expect(firefliesQueries.updateMeetingPrivacy({ privacy: 'owner' })).toContain('UpdateMeetingPrivacy($id: ID!)');
    expect(firefliesQueries.updateMeetingChannel).toContain('$channelId: ID!');
    expect(firefliesQueries.shareMeeting({ withExpiry: false })).toContain('ShareMeeting($meetingId: ID!, $emails: [String!]!)');
    expect(firefliesQueries.shareMeeting({ withExpiry: true })).toContain('ShareMeeting($meetingId: ID!, $emails: [String!]!, $expiryDays: Int!)');
    expect(firefliesQueries.revokeSharedMeetingAccess).toContain('RevokeSharedMeetingAccess($meetingId: ID!, $email: String!)');
  });

  test('String! inputs stay String!', () => {
    expect(firefliesQueries.updateMeetingTitle).toContain('UpdateMeetingTitle($id: String!, $title: String!)');
    expect(firefliesQueries.deleteTranscript).toContain('DeleteTranscript($transcriptId: String!)');
  });

  test('transcripts scope is a String argument, so it is sent quoted', () => {
    const query = firefliesQueries.searchTranscripts({ variables: [{ variable: 'keyword', argument: 'keyword', type: 'String!' }], scope: 'sentences', fields: 'slim' });
    expect(query).toContain('scope: "sentences"');
    expect(query).not.toMatch(/scope: sentences/);
  });

  test('ask_fred format_mode is declared as the FormatMode enum', () => {
    const request = askFredInternals.buildAskFred({
      query: 'q',
      meetingId: 'm-1',
      fromDate: undefined,
      toDate: undefined,
      organizers: undefined,
      participants: undefined,
      channelIds: undefined,
      meetingIds: undefined,
      responseLanguage: undefined,
      formatMode: undefined,
    });
    const query = firefliesQueries.createAskFredThread({ inputFields: request.inputFields, filterFields: request.filterFields, variables: [...request.inputFields, ...request.filterFields] });
    expect(query).toContain('$formatMode: FormatMode!');
    expect(query).toContain('$transcriptId: String!');
  });
});
