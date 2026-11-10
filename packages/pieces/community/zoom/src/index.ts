import { createCustomApiCallAction, httpClient, HttpMethod } from '@activepieces/pieces-common';
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
import { zoomListPastMeetingInstances } from './lib/actions/list-past-meeting-instances';
import { zoomListRecordings } from './lib/actions/list-recordings';

export const zoomAuth = PieceAuth.OAuth2({
  description: `
  1. Go to [marketplace.zoom.us](https://marketplace.zoom.us/) and log in to your account.
  2. In the upper-right corner, click **Develop** then **Build App**.
  3. Select **General App**.
  4. Copy the Client ID and Client Secret.Add Redirect URL and press continue.
  5. Go to **Scopes** from left side bar and add the scopes for the actions you use:
     - Meetings: **meeting:write:meeting**, **meeting:read:meeting**, **meeting:read:list_meetings**, **meeting:update:meeting**, **meeting:delete:meeting**
     - Registrants: **meeting:write:registrant**
     - Past meetings: **meeting:read:list_past_instances**
     - Cloud recordings: **cloud_recording:read:list_user_recordings**
     - Current user: **user:read:user**
  6. After adding scopes to an existing app, reconnect this connection so Zoom grants them.`,
  authUrl: 'https://zoom.us/oauth/authorize',
  tokenUrl: 'https://zoom.us/oauth/token',
  required: true,
  scope: [],
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest<{ email?: string; display_name?: string }>({
        method: HttpMethod.GET,
        url: 'https://api.zoom.us/v2/users/me',
        headers: { Authorization: `Bearer ${auth.access_token}` },
        timeout: 5000,
      });
      return response.body.email || response.body.display_name || undefined;
    } catch {
      return undefined;
    }
  },
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
    zoomListPastMeetingInstances,
    zoomListRecordings,
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
