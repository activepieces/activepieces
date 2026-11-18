import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { getCallAction } from './lib/actions/get-call';
import { queryCallsAction } from './lib/actions/query-calls';
import { fetchCallDetailsAction } from './lib/actions/fetch-call-details';
import { fetchCallTranscriptAction } from './lib/actions/fetch-call-transcript';
import { listCallNotesAction } from './lib/actions/list-call-notes';
import { listUsersAction } from './lib/actions/list-users';
import { listMeetingEventsAction } from './lib/actions/list-meeting-events';
import { createMeetingEventAction } from './lib/actions/create-meeting-event';
import { newCallCreatedTrigger } from './lib/triggers/new-call-created';
import { leexiAuth } from './lib/common/auth';
import { BASE_URL } from './lib/common/constants';

export const leexi = createPiece({
  displayName: 'Leexi',
  description: 'AI Notetaker',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.PRODUCTIVITY],
  auth: leexiAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/leexi.png',
  authors: ['kishanprmr', 'OdaiAhmed99'],
  actions: [
    getCallAction,
    queryCallsAction,
    fetchCallDetailsAction,
    fetchCallTranscriptAction,
    listCallNotesAction,
    listUsersAction,
    listMeetingEventsAction,
    createMeetingEventAction,
    createCustomApiCallAction({
      auth: leexiAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => {
        return {
          Authorization: `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`,
        };
      },
    }),
  ],
  triggers: [newCallCreatedTrigger],
});
