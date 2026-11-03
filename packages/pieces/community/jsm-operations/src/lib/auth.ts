import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { jsmOps } from './common/client';

export const jsmAccountAuth = PieceAuth.CustomAuth({
    displayName: 'Atlassian Account',
    description: `Use this for every action. It connects with your Atlassian email and an API token.

1. Open [API tokens](https://id.atlassian.com/manage-profile/security/api-tokens) and click **Create API token** (not "with scopes").
2. Copy the token and paste it below with the email you sign in with.
3. Enter your site URL, like https://your-company.atlassian.net.

The account needs access to JSM Operations (alerts, teams and schedules) on that site.`,
    required: true,
    props: {
        siteUrl: Property.ShortText({
            displayName: 'Site URL',
            description: 'Your Atlassian Cloud site address.',
            placeholder: 'https://your-company.atlassian.net',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: 'The email address of the Atlassian account.',
            placeholder: 'you@example.com',
            required: true,
        }),
        apiToken: PieceAuth.SecretText({
            displayName: 'API Token',
            description: 'An unscoped API token from id.atlassian.com.',
            required: true,
        }),
        cloudId: Property.ShortText({
            displayName: 'Cloud ID',
            description: 'Leave empty to look it up from the site URL.',
            required: false,
        }),
    },
    validate: async ({ auth }) => jsmOps.validateAccount(auth),
});

export const jsmKeyAuth = PieceAuth.BasicAuth({
    displayName: 'Alert API Key (Opsgenie or JSM integration)',
    description: `Use this to create, acknowledge and close alerts or add notes with an integration API key. Other actions and the trigger need an Atlassian Account connection.

- **JSM Operations:** open **Operations > Integrations**, add an **API** integration, copy its API key, and enter \`jsm\` as the API host.
- **Opsgenie:** open **Settings > Integrations**, add an **API** integration, and copy its API key. Enter \`us\` as the API host, or \`eu\` if your Opsgenie address contains "eu".`,
    required: true,
    username: {
        displayName: 'API Host',
        description: 'jsm (JSM integration), us (Opsgenie US) or eu (Opsgenie EU).',
    },
    password: {
        displayName: 'API Key',
        description: 'The API key of an API integration.',
    },
    validate: async ({ auth }) => jsmOps.validateKey(auth),
});

export const jsmOpsAuth = [jsmAccountAuth, jsmKeyAuth];
