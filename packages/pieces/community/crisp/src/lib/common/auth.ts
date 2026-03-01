import { PieceAuth } from '@activepieces/pieces-framework';

const authMarkdown = `

1.Go to the [Crisp Marketplace](https://marketplace.crisp.chat/);
2.Sign in or create an account (this account is different from your main Crisp account);
3.Once logged-in, go to Plugins and click on the New Plugin button;
4.Select the plugin type, in this case Private;
5.Give your plugin a name, eg. "Integration", and hit Create;
6.On the plugin page, go to Tokens and scroll down to Production;
7.Click on "Ask a production token", and pick the scopes you require;
  - website:conversation:messages website:conversation:sessions website:people:profiles
8.Click on "Request production token";
(wait that your submission gets approved, this can take a few minutes);
9.Once accepted, come back to Tokens, and copy your Production token keypair (configure it securely in your integration code);
10.Finally, install the plugin on all websites you need to use it for (using the private install link, provided in the Settings section under Danger Zone / Visibility);
`;

export const crispAuth = PieceAuth.CustomAuth({
  description: authMarkdown,
  required: true,
  props: {
    identifier: PieceAuth.SecretText({
      displayName: 'Identifier',
      required: true,
    }),
    token: PieceAuth.SecretText({
      displayName: 'Key',
      required: true,
    }),
  },
});
