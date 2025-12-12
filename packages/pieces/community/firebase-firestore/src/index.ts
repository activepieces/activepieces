import { createPiece } from '@activepieces/pieces-framework';
import { firestoreAuth } from './lib/common/auth';
import { createFirestoreDocument } from './lib/actions/create-firestore-document';
import { updateFirestoreDocument } from './lib/actions/update-firestore-document';
import { findFirestoreDocument } from './lib/actions/find-firestore-document';

export const firebaseFirestore = createPiece({
  displayName: 'firebase-firestore',
  auth: firestoreAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/firebase-firestore.png',
  authors: ['sanket-a11y'],
  actions: [createFirestoreDocument, updateFirestoreDocument, findFirestoreDocument],
  triggers: [],
});
