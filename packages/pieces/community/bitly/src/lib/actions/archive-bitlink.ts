import { createAction, Property } from '@activepieces/pieces-framework';
import { BitlyAuth } from '../common/auth';

export const archiveBitlink = createAction({
  auth: BitlyAuth,
  name: 'archiveBitlink',
  displayName: 'Archive Bitlink',
  description: '',
  props: {},
  async run() {
    // Action logic here
  },
});
