import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { zoomCreateMeeting } from './lib/actions/create-meeting';
import { zoomCreateMeetingRegistrant } from './lib/actions/create-meeting-registrant';
import { zoomFindMeeting } from './lib/actions/find-meeting';
import { zoomUpdateMeeting } from './lib/actions/update-meeting';
import { zoomGetMeeting } from './lib/actions/get-meeting';
import { zoomUpdateMeetingById } from './lib/actions/update-meeting-by-id';
import { zoomListMeetings } from './lib/actions/list-meetings';
import { zoomDeleteMeeting } from './lib/actions/delete-meeting';
import { zoomGetCurrentUser } from './lib/actions/get-current-user';
import { zoomListMeetingRegistrants } from './lib/actions/list-meeting-registrants';
import { zoomUpdateRegistrantStatus } from './lib/actions/update-registrant-status';
import { zoomListPastMeetingInstances } from './lib/actions/list-past-meeting-instances';
import { zoomGetPastMeeting } from './lib/actions/get-past-meeting';
import { zoomListPastMeetingParticipants } from './lib/actions/list-past-meeting-participants';
import { zoomGetMeetingSummary } from './lib/actions/get-meeting-summary';
import { zoomListRecordings } from './lib/actions/list-recordings';
import { zoomGetMeetingRecordings } from './lib/actions/get-meeting-recordings';
import { zoomDeleteMeetingRecordings } from './lib/actions/delete-meeting-recordings';

export const zoomAuth = PieceAuth.OAuth2({
  description: `
  1. Go to [marketplace.zoom.us](https://marketplace.zoom.us/) and log in to your account.
  2. In the upper-right corner, click **Develop** then **Build App**.
  3. Select **General App**.
  4. Copy the Client ID and Client Secret.Add Redirect URL and press continue.
  5. Go to **Scopes** from left side bar and add the scopes for the actions you use:
     - Meetings: **meeting:write:meeting**, **meeting:read:meeting**, **meeting:read:list_meetings**, **meeting:update:meeting**, **meeting:delete:meeting**
     - Registrants: **meeting:write:registrant**, **meeting:read:list_registrants**, **meeting:update:registrant_status**
     - Past meetings and summaries: **meeting:read:past_meeting**, **meeting:read:list_past_instances**, **meeting:read:list_past_participants**, **meeting:read:summary**
     - Cloud recordings: **cloud_recording:read:list_user_recordings**, **cloud_recording:read:list_recording_files**, **cloud_recording:delete:meeting_recording**
     - Current user: **user:read:user**
  6. After adding scopes to an existing app, reconnect this connection so Zoom grants them.`,
  authUrl: 'https://zoom.us/oauth/authorize',
  tokenUrl: 'https://zoom.us/oauth/token',
  required: true,
  scope: [],
});

export const zoom = createPiece({
  displayName: 'Zoom',
  description: 'Video conferencing, web conferencing, webinars, screen sharing',

  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/zoom.png',
  categories: [PieceCategory.COMMUNICATION],
  actions: [
    zoomCreateMeeting,
    zoomCreateMeetingRegistrant,
    zoomFindMeeting,
    zoomUpdateMeeting,
    zoomGetMeeting,
    zoomUpdateMeetingById,
    zoomListMeetings,
    zoomDeleteMeeting,
    zoomGetCurrentUser,
    zoomListMeetingRegistrants,
    zoomUpdateRegistrantStatus,
    zoomListPastMeetingInstances,
    zoomGetPastMeeting,
    zoomListPastMeetingParticipants,
    zoomGetMeetingSummary,
    zoomListRecordings,
    zoomGetMeetingRecordings,
    zoomDeleteMeetingRecordings,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.zoom.us/v2',
      auth: zoomAuth,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.access_token}`,
        };
      },
    }),
  ],
  auth: zoomAuth,
  authors: ['kanarelo', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud', 'murex971'],
  triggers: [],
});
