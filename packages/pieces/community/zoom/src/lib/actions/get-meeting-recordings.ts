import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zoomAuth } from '../..';
import { zoomClient } from '../common/client';
import { zoomProps } from '../common/props';
import { getMeetingRecordingsOutputSchema } from '../output-schemas';

export const zoomGetMeetingRecordings = createAction({
  auth: zoomAuth,
  name: 'zoom_get_meeting_recordings',
  displayName: 'Get Meeting Recordings',
  description: 'Get the cloud recording files of a meeting (paid Zoom plan with cloud recording).',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description: 'Returns the cloud recording files of one Zoom meeting (type, size, play and download URLs) without downloading them. Use after a meeting ends to share or process its recording; needs a paid plan with cloud recording. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: getMeetingRecordingsOutputSchema,
  props: {
    meeting: zoomProps.meetingIdOrUuid({ description: 'A meeting UUID from List Past Meeting Instances (for one specific past instance), or a numeric meeting ID (for its most recent instance).' }),
  },
  async run(context) {
    const meetingPath = zoomClient.meetingIdOrUuidPath(context.propsValue.meeting);
    return zoomClient.requestObject({
      accessToken: context.auth.access_token,
      method: HttpMethod.GET,
      path: `/meetings/${meetingPath}/recordings`,
      scope: 'cloud_recording:read:list_recording_files',
    });
  },
});
