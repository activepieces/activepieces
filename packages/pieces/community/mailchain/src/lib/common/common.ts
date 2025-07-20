import { PieceAuth, Property } from '@activepieces/pieces-framework';

const message = `**Getting Started with Mailchain:**

To send emails using the Mailchain Protocol, you need to first create an account on [Mailchain](https://app.mailchain.com/). Once your account is set up, you will receive a Mailchain address. You can also connect your wallet to associate a blockchain address with your Mailchain account.

**Recipients:**

When sending an email, you can use either a Mailchain address or a blockchain address as the recipient. For blockchain addresses, you can leverage supported web3 domain services, including ENS, Unstoppable Domains, Lens, Coinbase, and many more.

**Example Usage:**
- **Mailchain Address:** 'yourname@mailchain.com'
- **Blockchain Address:** 'yourname.eth' (ENS), 'yourname.crypto' (Unstoppable Domains), etc.

To manage your inbox and send emails, visit [Mailchain's Web App](https://app.mailchain.com/).
`;

export const mailchainCommon = {
  auth: PieceAuth.SecretText({
    displayName: 'Secret Recovery Phrase',
    description:
      'The secret recovery phrase (25-word mnemonic phrase) to authenticate with the Mailchain Protocol. You can obtain this phrase when setting up your Mailchain account.',
    required: true,
  }),
  markdown: Property.MarkDown({
    value: message,
  }),
  to: Property.Array({
    displayName: 'To',
    description: 'The blockchain or mailchain addresses to send the email to',
    required: true,
  }),
  subject: Property.ShortText({
    displayName: 'Subject',
    description: 'The subject of the email',
    required: true,
  }),
  content: Property.LongText({
    displayName: 'Content',
    description: 'The content of the email',
    required: true,
  }),
};
