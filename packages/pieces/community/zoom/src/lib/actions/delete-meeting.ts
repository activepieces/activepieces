import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zoomAuth } from '../..';
import { ZoomApiError, zoomClient } from '../common/client';
import { zoomProps } from '../common/props';
import { deleteMeetingOutputSchema } from '../output-schemas';

export const zoomDeleteMeeting = createAction({
  auth: zoomAuth,
  name: 'zoom_delete_meeting',
  displayName: 'Delete Meeting',
  description: 'Delete a meeting, or one occurrence of a recurring meeting.',
  classification: 'DESTRUCTIVE',
  audience: 'both',
  aiMetadata: {
    description: 'Deletes a Zoom meeting, or one occurrence of a recurring meeting, and can email the host and registrants a cancellation. Use only when the user asks to cancel a meeting; this cannot be undone. Not idempotent: a repeat call fails with meeting not found, because Zoom cannot tell an already-deleted meeting from a wrong ID.',
    idempotent: false,
  },
  outputSchema: deleteMeetingOutputSchema,
  props: {
    meeting_id: zoomProps.meetingId({ description: 'The numeric Zoom meeting ID to delete, for example 85746065432. Find it with List Meetings.' }),
    occurrence_id: zoomProps.occurrenceId(),
    schedule_for_reminder: Property.Checkbox({
      displayName: 'Notify Host and Alternative Hosts',
      description: 'Email the host and alternative hosts that the meeting was cancelled.',
      required: false,
      defaultValue: false,
    }),
    cancel_meeting_reminder: Property.Checkbox({
      displayName: 'Notify Registrants',
      description: 'Email registrants that the meeting was cancelled.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const meetingId = zoomClient.normalizeMeetingId(context.propsValue.meeting_id);
    const occurrenceId = zoomClient.optionalText(context.propsValue.occurrence_id);
    try {
      await zoomClient.request({
        accessToken: context.auth.access_token,
        method: HttpMethod.DELETE,
        path: `/meetings/${meetingId}`,
        query: {
          occurrence_id: occurrenceId,
          schedule_for_reminder: context.propsValue.schedule_for_reminder === true ? 'true' : 'false',
          cancel_meeting_reminder: context.propsValue.cancel_meeting_reminder === true ? 'true' : 'false',
        },
        scope: 'meeting:delete:meeting',
      });
    } catch (error) {
      if (error instanceof ZoomApiError && error.status === 404 && error.code === 3001) {
        throw new Error(`Zoom meeting ${meetingId} was not found. It may already be deleted, or the meeting ID is wrong. Check it with List Meetings.`);
      }
      throw error;
    }
    return { success: true, meeting_id: meetingId, occurrence_id: occurrenceId ?? null };
  },
});
