import { createAction, Property } from '@activepieces/pieces-framework';
import { firestoreAuth } from '../common/auth';

export const createFirestoreDocument = createAction({
  auth: firestoreAuth,
  name: 'createFirestoreDocument',
  displayName: 'Create Firestore Document',
  description: '',
  props: {},
  async run() {
    // Action logic here
  },
});
