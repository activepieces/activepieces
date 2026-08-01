import { createAction, Property } from '@activepieces/pieces-framework';
import * as openpgp from 'openpgp';

export const openpgpEncrypt = createAction({
  audience: 'both',
  name: 'openpgpEncrypt',
  displayName: 'OpenPGP Encrypt',
  description: 'Encrypt a file using OpenPGP public key',
  aiMetadata: { description: 'Encrypts a binary file with an OpenPGP public key in ASCII-armor format and writes out an armored .pgp file. Pick this to protect an attachment before handing it to a recipient who holds the matching private key; this piece offers no decrypt counterpart. Requires a valid armored public key, and an unreadable key is reported as a failed result rather than raising an error; not idempotent: each call derives a fresh random session key, so the same input produces different ciphertext.', idempotent: false },
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to encrypt',
      required: true,
    }),
    publicKey: Property.LongText({
      displayName: 'Public Key',
      description: 'The PGP public key in ASCII armor format',
      required: true,
    }),
  },
  async run(context) {
    try {
      if (!context.propsValue.publicKey) {
        throw new Error('Public key is required');
      }

      const publicKey = await openpgp.readKey({ armoredKey: context.propsValue.publicKey });

      const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ 
          binary: context.propsValue.file.data 
        }),
        encryptionKeys: publicKey,
        format: 'armored',
      });

      return {
        success: true,
        filename: context.propsValue.file.filename + '.pgp',
        file: await context.files.write({
          fileName: context.propsValue.file.filename + '.pgp',
          data: Buffer.from(encrypted)
        })
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Encryption failed'
      };
    }
  },
});