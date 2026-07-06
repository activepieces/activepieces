import { createAction } from '@activepieces/pieces-framework';
import { Mailchain } from '@mailchain/sdk';
import { mailchainCommon } from '../common/common';

export const sendEmail = createAction({
  name: 'sendEmail',
  displayName: 'Send Email',
  description: 'Send an email to blockchain or mailchain addresses',
  audience: 'both',
  aiMetadata: { description: 'Sends an email over the Mailchain protocol from the connected account to one or more recipients, which may be blockchain or Mailchain addresses. The same text body is sent as both plain text and HTML. Use to deliver decentralized messages; each call sends a new email, so it is not idempotent.', idempotent: false },
  auth: mailchainCommon.auth,
  requireAuth: true,
  props: {
    markdown: mailchainCommon.markdown,
    to: mailchainCommon.to,
    subject: mailchainCommon.subject,
    content: mailchainCommon.content,
  },
  async run({ auth, propsValue: { to, subject, content } }) {
    try {
      const secretRecoveryPhrase = auth;

      const mailchain =
        Mailchain.fromSecretRecoveryPhrase(secretRecoveryPhrase.secret_text);

      const user = await mailchain.user();
      console.log(`username: ${user.username}, address: ${user.address}`);

      const { data, error } = await mailchain.sendMail({
        from: user.address, // sender address
        to: to as string[], // list of recipients (blockchain or mailchain addresses)
        subject: subject,
        content: {
          text: content,
          html: content,
        },
      });
      if (error) {
        console.error('Error sending email (mailchain)', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error sending email (mailchain)', error);
      throw error;
    }
  },
});
