
import { PieceAuth, Property, createPiece } from '@activepieces/pieces-framework';
import { sendEmail } from './lib/actions/send-email';

export const smtpAuth = PieceAuth.CustomAuth({
  displayName: 'Authentication',
  required: true,
  props: {
    host: Property.ShortText({
      displayName: 'Host',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      required: true,
    }),
    port: Property.ShortText({
      displayName: 'Port',
      required: true,
    }),
    TLS: Property.Checkbox({
      displayName: 'Use TLS',
      defaultValue: false,
      required: true,
    }),
  },
})

export const smtp = createPiece({
  displayName: 'SMTP',
      minimumSupportedRelease: '0.5.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/smtp.png',
  authors: [
    'abaza738'
  ],
  auth: smtpAuth,
  actions: [
    sendEmail,
  ],
  triggers: [
  ],
});
