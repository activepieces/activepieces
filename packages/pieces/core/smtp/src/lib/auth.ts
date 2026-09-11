import {
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { smtpCommon } from './common';

const SMTPPorts = [25, 465, 587, 2525];

export const smtpAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    host: Property.ShortText({
      displayName: 'Host',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Leave blank if your mail relay does not require authentication.',
      required: false,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Leave blank if your mail relay does not require authentication.',
      required: false,
    }),
    port: Property.StaticDropdown({
      displayName: 'Port',
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
      displayName: 'Require TLS?',
      defaultValue: false,
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const transporter = smtpCommon.createSMTPTransport(auth);
      return new Promise((resolve) => {
        transporter.verify(function (error) {
          if (error) {
            resolve({ valid: false, error: JSON.stringify(error) });
          } else {
            resolve({ valid: true });
          }
        });
      });
    } catch (e) {
      const castedError = (e as Record<string, unknown>);
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
