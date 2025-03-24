import { createAction } from '@activepieces/pieces-framework';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Mailchain } from '@mailchain/sdk';
import { mailchainCommon } from '../common/common';

export const sendEmail = createAction({
  name: 'sendEmail',
  displayName: 'Send Email',
  description: 'Send an email to blockchain or mailchain addresses',
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
        Mailchain.fromSecretRecoveryPhrase(secretRecoveryPhrase);

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
