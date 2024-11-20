import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { ImapFlow } from 'imapflow';
import { imapCommon } from './lib/common';
import { newEmail } from './lib/triggers/new-email';

const description = `
**Gmail Users:**
<br><br>
Make Sure of the following:
<br>
* IMAP is enabled in your Gmail settings (https://support.google.com/mail/answer/7126229?hl=en)
* You have created an App Password to login with (https://support.google.com/accounts/answer/185833?hl=en)
* Enable TLS and set the port to 993 and the host to imap.gmail.com
`;
export const imapAuth = PieceAuth.CustomAuth({
  description: description,
  props: {
    host: Property.ShortText({
      displayName: 'Host',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      required: true,
    }),
    port: Property.Number({
      displayName: 'Port',
      required: true,
      defaultValue: 143,
    }),
    tls: Property.Checkbox({
      displayName: 'Use TLS',
      defaultValue: false,
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const imapConfig = imapCommon.constructConfig(
      auth as {
        host: string;
        username: string;
        password: string;
        port: number;
        tls: boolean;
      }
    );
    const imapClient = new ImapFlow({ ...imapConfig, logger: false });
    try {
      await imapClient.connect();
      await imapClient.noop();
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: JSON.stringify(e),
      };
    } finally {
      await imapClient.logout();
    }
  },
  required: true,
});

export const imapPiece = createPiece({
  displayName: 'IMAP',
  description: 'Receive new email trigger',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/imap.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  auth: imapAuth,
  actions: [],
  triggers: [newEmail],
});
