import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsClient } from './common/client';

const cloudProperty = Property.StaticDropdown({
  displayName: 'Cloud Environment',
  description: 'Select your Microsoft cloud environment.',
  required: true,
  defaultValue: 'login.microsoftonline.com',
  options: {
    disabled: false,
    options: [
      { label: 'Commercial (Global)', value: 'login.microsoftonline.com' },
      { label: 'US Government (GCC High)', value: 'login.microsoftonline.us' },
    ],
  },
});

const authDesc = `
When you connect, Activepieces shows a **permissions** selector. Tick only the
scopes for the actions you plan to use — narrower connections request less
access. **Keep \`openid\`, \`email\`, \`profile\`, \`offline_access\` and \`User.Read\`
selected**: the connection needs them to sign in, refresh its token, and be
validated. The scopes group roughly as:
  - **Channel read** — \`Channel.ReadBasic.All\`, \`Team.ReadBasic.All\`, \`ChannelMessage.Read.All\`
  - **Channel management** — adds \`Channel.Create\`, \`ChannelMessage.Send\`
  - **Chat (read & manage)** — \`Chat.ReadWrite\`
  - **Members & presence** — \`TeamMember.Read.All\`, \`User.ReadBasic.All\`, \`Presence.Read.All\`
  - **Meetings** — \`OnlineMeetingTranscript.Read.All\`, \`OnlineMeetingRecording.Read.All\`

If you'd like to use your own custom Azure app instead of the default app, follow the [Azure app creation guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app#register-an-application),
 set the **Redirect URI** to {{redirectUrl}} and expose the full set of **Microsoft Graph (Delegated) permissions** above under **API permissions** (the connector must be able to request any scope the user selects).

Leave **Tenant ID** as \`common\` for the default multi-tenant flow, or set it to your Directory (tenant) ID (a GUID) / \`<name>.onmicrosoft.com\` domain if your app registration is single-tenant.`;

export const microsoftTeamsAuth = PieceAuth.OAuth2({
  description: authDesc,
  props: {
    cloud: cloudProperty,
    tenantId: Property.ShortText({
      displayName: 'Tenant ID',
      description:
        'Use "common" for the default multi-tenant flow, or your Directory ' +
        '(tenant) ID (a GUID) / "<name>.onmicrosoft.com" domain for a ' +
        'single-tenant app registration.',
      required: true,
      defaultValue: 'common',
    }),
  },
  required: true,
  scope: [
    'openid',
    'email',
    'profile',
    'offline_access',
    'User.Read',
    'Channel.Create',
    'Channel.ReadBasic.All',
    'ChannelMessage.Send',
    'Team.ReadBasic.All',
    'Chat.ReadWrite',
    'ChannelMessage.Read.All',
    'TeamMember.Read.All',
    'User.ReadBasic.All',
    'Presence.Read.All',
    'OnlineMeetingTranscript.Read.All',
    'OnlineMeetingRecording.Read.All',
  ],
  prompt: 'omit',
  authUrl: 'https://{cloud}/{tenantId}/oauth2/v2.0/authorize',
  tokenUrl: 'https://{cloud}/{tenantId}/oauth2/v2.0/token',
  validate: async ({ auth }) => {
    try {
      const client = microsoftTeamsClient.create({
        auth: { access_token: auth.access_token, props: auth.props },
      });
      await microsoftTeamsClient.withRetry(() => client.api('/me').get());
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid Credentials.' };
    }
  },
});
