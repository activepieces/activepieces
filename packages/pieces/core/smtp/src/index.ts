import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { sendEmail } from './lib/actions/send-email';
import { smtpCommon } from './lib/common';

const SMTPPorts = [25, 465, 587, 2525];

export const smtpAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    host: Property.ShortText({
      displayName: 'Host',
      placeholder: 'smtp.example.com',
      required: true,
    }),
    port: Property.StaticDropdown({
      displayName: 'Port',
      description:
        '465 encrypts from the start; other ports upgrade to STARTTLS if the server offers it.',
      required: true,
      options: {
        disabled: false,
        options: SMTPPorts.map((port) => {
          return {
            label: port.toString(),
            value: port,
          };
        }),
      },
    }),
    TLS: Property.Checkbox({
      displayName: 'Require TLS',
      description: 'Fail instead of sending unencrypted if STARTTLS is unavailable.',
      defaultValue: false,
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Login name, usually your email address. Blank if no login is needed.',
      placeholder: 'you@example.com',
      required: false,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Leave blank if your mail relay does not require authentication.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
        try {
      const transporter = smtpCommon.createSMTPTransport(auth);
      return new Promise((resolve, reject) => {
        transporter.verify(function (error, success) {
          if (error) {
            resolve({ valid: false, error: JSON.stringify(error) });
          } else {
            resolve({ valid: true });
          }
        });
      });
    } catch (e) {
      const castedError = (e as Record<string, unknown>)
      const code = castedError?.['code'];
      switch (code) {
        case 'EDNS':
          return {
            valid: false,
            error: 'SMTP server not found or unreachable with error code: EDNS',
          };
        case 'CONN':
          return {
            valid: false,
            error: 'SMTP server connection failed with error code: CONN',
          };
        default:
          break;
      }
      return {
        valid: false,
        error: JSON.stringify(e),
      };
    }
  },
});

export const smtp = createPiece({
  displayName: 'SMTP',
  description: 'Send emails using Simple Mail Transfer Protocol',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/new-core/smtp.svg',
  categories: [PieceCategory.CORE],
  authors: [
    'tahboubali',
    'abaza738',
    'kishanprmr',
    'MoShizzle',
    'khaledmashaly',
    'abuaboud',
    'pfernandez98'
  ],
  auth: smtpAuth,
  actions: [sendEmail],
  triggers: [],
});
