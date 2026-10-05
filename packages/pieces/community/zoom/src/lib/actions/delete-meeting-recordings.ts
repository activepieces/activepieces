import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zoomAuth } from '../..';
import { ZoomApiError, zoomClient } from '../common/client';
import { zoomProps } from '../common/props';
import { deleteMeetingRecordingsOutputSchema } from '../output-schemas';

export const zoomDeleteMeetingRecordings = createAction({
  auth: zoomAuth,
  name: 'zoom_delete_meeting_recordings',
  displayName: 'Delete Meeting Recordings',
  description: 'Move all cloud recordings of a meeting to trash, or delete them permanently (paid Zoom plan).',
  classification: 'DESTRUCTIVE',
  audience: 'both',
  aiMetadata: {
    description: 'Moves all cloud recordings of a Zoom meeting to trash (recoverable for 30 days) or deletes them permanently; needs a paid plan with cloud recording. Use only when the user asks to remove recordings. Not idempotent: a repeat call fails with recording not found, because Zoom cannot tell already-deleted recordings from a meeting that was never recorded.',
    idempotent: false,
  },
  outputSchema: deleteMeetingRecordingsOutputSchema,
  props: {
    meeting: zoomProps.meetingIdOrUuid({ description: 'A meeting UUID from List Past Meeting Instances (for one specific past instance), or a numeric meeting ID (for its most recent instance).' }),
    action: Property.StaticDropdown({
      displayName: 'Delete Mode',
      description: 'Trash keeps the recordings recoverable for 30 days; Delete removes them permanently.',
      required: false,
      defaultValue: 'trash',
      options: {
        disabled: false,
        options: [
          { label: 'Move to trash', value: 'trash' },
          { label: 'Delete permanently', value: 'delete' },
        ],
      },
    }),
  },
  async run(context) {
    const meetingPath = zoomClient.meetingIdOrUuidPath(context.propsValue.meeting);
    const action = zoomClient.optionalText(context.propsValue.action) ?? 'trash';
    if (action !== 'trash' && action !== 'delete') {
      throw new Error('Delete Mode must be trash or delete.');
    }
    const meeting = String(context.propsValue.meeting).trim();
    try {
      await zoomClient.request({
        accessToken: context.auth.access_token,
        method: HttpMethod.DELETE,
        path: `/meetings/${meetingPath}/recordings`,
        query: { action },
        scope: 'cloud_recording:delete:meeting_recording',
      });
    } catch (error) {
      if (error instanceof ZoomApiError && error.status === 404 && error.code === 3301) {
        throw new Error(`Zoom has no cloud recordings for meeting ${meeting}. They may already be deleted, or the meeting was not recorded to the cloud.`);
      }
      throw error;
    }
    return { success: true, meeting, action };
  },
});
