import { HttpMethod } from '@activepieces/pieces-common';
import { zoomClient } from './client';

async function getMeeting({
  accessToken,
  meetingId,
  occurrenceId,
  showPreviousOccurrences,
}: {
  accessToken: string;
  meetingId: unknown;
  occurrenceId: unknown;
  showPreviousOccurrences: unknown;
}): Promise<Record<string, unknown>> {
  const id = zoomClient.normalizeMeetingId(meetingId);
  return zoomClient.requestObject({
    accessToken,
    method: HttpMethod.GET,
    path: `/meetings/${id}`,
    query: {
      occurrence_id: zoomClient.optionalText(occurrenceId),
      show_previous_occurrences: showPreviousOccurrences === true ? 'true' : undefined,
    },
    scope: 'meeting:read:meeting',
  });
}

export const zoomMeetings = {
  getMeeting,
};
