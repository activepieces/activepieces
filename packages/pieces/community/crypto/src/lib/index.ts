import { createPiece } from '@activepieces/pieces-framework';
import { base64Encode } from './actions/base64-encode';
import { base64Decode } from './actions/base64-decode';
import { generatePassword } from './actions/generate-password';
import { hashText } from './actions/hash-text';
import { hmacSignature } from './actions/hmac-signature';
import { openPgpEncrypt } from './actions/openpgp-encrypt';
import { generateUuid } from './actions/generate-uuid';   

export const crypto = createPiece({
  name: 'crypto',
  displayName: 'Crypto',
  description: 'Cryptographic utilities and transformations.',
  actions: [
    base64Encode,
    base64Decode,
    generatePassword,
    hashText,
    hmacSignature,
    openPgpEncrypt,
    generateUuid,         
  ],
  authors: [],
});
