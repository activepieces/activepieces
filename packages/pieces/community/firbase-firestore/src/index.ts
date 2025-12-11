import { createPiece } from '@activepieces/pieces-framework';
import { firestoreAuth } from './lib/common/auth';
import { createFirestoreDocument } from './lib/actions/create-firestore-document';

export const firbaseFirestore = createPiece({
  displayName: 'Firbase-firestore',
  auth: firestoreAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/firbase-firestore.png',
  authors: ['sanket-a11y'],
  actions: [createFirestoreDocument],
  triggers: [],
});
