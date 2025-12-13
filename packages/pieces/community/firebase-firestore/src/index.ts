import { createPiece } from '@activepieces/pieces-framework';
import { firestoreAuth } from './lib/common/auth';
import { createFirestoreDocument } from './lib/actions/create-firestore-document';
import { createOrReplaceRealtimeDatabaseRecord } from './lib/actions/createOrReplaceRealtimeDatabaseRecord';
import { findFirestoreDocument } from './lib/actions/find-firestore-document';
import { newDocumentWithinACollection } from './lib/triggers/new-document-within-a-collection';
// import { newchildobjectinrealtimedatabase } from './lib/triggers/newchildobjectinrealtimedatabase';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const firebaseFirestore = createPiece({
  displayName: 'firebase-firestore',
  auth: firestoreAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/firebase-firestore.png',
  authors: ['sanket-a11y'],
  actions: [
    createFirestoreDocument,
    createOrReplaceRealtimeDatabaseRecord,
    findFirestoreDocument,
    createCustomApiCallAction({
      auth: firestoreAuth,
      baseUrl: () => 'https://firestore.googleapis.com/v1',
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.access_token}`,
        };
      },
    }),
  ],
  triggers: [newDocumentWithinACollection, ],
});
