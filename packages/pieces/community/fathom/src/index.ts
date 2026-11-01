import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { getRecordingSummary } from './lib/actions/get-recording-summary';
import { getRecordingTranscript } from './lib/actions/get-recording-transcript';
import { listMeetings } from './lib/actions/list-meetings';
import { findTeam } from './lib/actions/find-team';
import { findTeamMember } from './lib/actions/find-team-member';
import { aiListMeetings } from './lib/actions/ai/list-meetings';
import { aiGetRecordingSummary } from './lib/actions/ai/get-recording-summary';
import { aiGetRecordingTranscript } from './lib/actions/ai/get-recording-transcript';
import { listMeetingTypes } from './lib/actions/list-meeting-types';
import { listUsers } from './lib/actions/list-users';
import { findTeamMemberByEmail } from './lib/actions/find-team-member-by-email';
import { requestRecordingDownload } from './lib/actions/request-recording-download';
import { getRecordingDownload } from './lib/actions/get-recording-download';
import { newRecording } from './lib/triggers/new-recording';
import { fathomAuth } from './lib/common/auth';
import { fathomClient } from './lib/common/client';

export { fathomAuth };

export const fathom = createPiece({
  displayName: 'Fathom',
  auth: fathomAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/fathom.png',
  authors: ['fortunamide', 'onyedikachi-david'],
  categories: [PieceCategory.PRODUCTIVITY],
  description:
    'Fathom is an AI meeting assistant that automatically records, transcribes, highlights, and generates AI summaries and action items from your meetings. Integrate with workflows to react to meeting events and retrieve meeting data.',
  actions: [
    getRecordingSummary,
    getRecordingTranscript,
    listMeetings,
    findTeam,
    findTeamMember,
    findTeamMemberByEmail,
    listMeetingTypes,
    listUsers,
    requestRecordingDownload,
    getRecordingDownload,
    aiListMeetings,
    aiGetRecordingSummary,
    aiGetRecordingTranscript,
    createCustomApiCallAction({
      baseUrl: () => fathomClient.baseUrl,
      auth: fathomAuth,
      authMapping: async (auth, propsValue) => {
        assertFathomUrl({ propsValue });
        return fathomClient.authHeaders(auth);
      },
    }),
  ],
  triggers: [newRecording],
});

function assertFathomUrl({ propsValue }: { propsValue: Record<string, unknown> }): void {
  const urlProp = propsValue['url'];
  const url = typeof urlProp === 'object' && urlProp !== null && 'url' in urlProp ? urlProp.url : undefined;
  if (typeof url !== 'string') {
    return;
  }
  const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//');
  if (!isAbsolute) {
    const path = url.split('?')[0];
    if (path.includes('..') || path.includes('\\') || path.includes('@')) {
      throw new Error('The URL must be a path on the Fathom API, such as /meetings.');
    }
    return;
  }
  if (!url.startsWith(`${fathomClient.baseUrl}/`) && url !== fathomClient.baseUrl) {
    throw new Error(`Custom API Call only sends your Fathom credentials to ${fathomClient.baseUrl}. Use a path such as /meetings.`);
  }
  const rest = url.slice(fathomClient.baseUrl.length).split('?')[0];
  if (rest.includes('..') || rest.includes('\\') || rest.includes('@')) {
    throw new Error('The URL must be a path on the Fathom API, such as /meetings.');
  }
}
