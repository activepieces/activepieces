import {
  PieceAuth,
  Property,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { performImapOperation } from './imap';
import { AppConnectionType } from '@activepieces/pieces-framework';

const description = `Enter your email provider's IMAP settings. Their help pages list them.

**Gmail**
1. Turn on IMAP in [Gmail settings](https://support.google.com/mail/answer/7126229?hl=en).
2. Create an [App Password](https://support.google.com/accounts/answer/185833?hl=en) and use it as the password.
3. Use host \`imap.gmail.com\`, port \`993\`, and turn on **Use TLS**.
`;

export const imapAuth = PieceAuth.CustomAuth({
  description: description,
  props: {
    host: Property.ShortText({
      displayName: 'Host',
      description: "Your provider's IMAP server address.",
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Usually your full email address.',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Your email password, or an App Password for Gmail.',
      required: true,
    }),
    port: Property.Number({
      displayName: 'Port',
      description: 'Usually 993 with TLS on, or 143 with TLS off.',
      required: true,
      defaultValue: 143,
    }),
    tls: Property.Checkbox({
      displayName: 'Use TLS',
      description: 'Turn on for port 993. Most providers require it.',
      defaultValue: false,
      required: true,
    }),
    validateCertificates: Property.Checkbox({
      displayName: 'Validate TLS Certificates',
      description:
        'Reject servers whose certificate is invalid or self-signed.',
      defaultValue: false,
      required: true,
    }),
  },
  async validate({
    auth,
  }): Promise<{ valid: true } | { valid: false; error: string }> {
    try {
      return (await performImapOperation({ type: AppConnectionType.CUSTOM_AUTH, props: auth }, async (imapClient) => {
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

export type ImapAuth = AppConnectionValueForAuthProperty<typeof imapAuth>;
