import {
  PieceAuth,
  Property,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { performImapOperation } from './imap';

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
    validateCertificates: Property.Checkbox({
      displayName: 'Validate TLS Certificates',
      description:
        'Enable TLS certificate validation (recommended for production).',
      defaultValue: false,
      required: true,
    }),
  },
  async validate({
    auth,
  }): Promise<{ valid: true } | { valid: false; error: string }> {
    try {
      return (await performImapOperation(auth, async (imapClient) => {
        imapClient.noop();
        return { valid: true };
      })) as { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      };
    }
  },
  required: true,
});

export type ImapAuth = PiecePropValueSchema<typeof imapAuth>;
