import { createAction, Property } from '@activepieces/pieces-framework';
import * as openpgp from 'openpgp';

export const openpgpEncrypt = createAction({
  name: 'openpgpEncrypt',
  displayName: 'OpenPGP Encrypt',
  description: 'Encrypt a file using OpenPGP public key',
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