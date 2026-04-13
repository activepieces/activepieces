import { PieceAuth } from '@activepieces/pieces-framework';
import { microsoftCloudProperty } from './microsoft-cloud';

const authDesc = `
**Note:** This piece requires a **Microsoft 365 Copilot license** to access Copilot interaction data.

If you’d like to use your own custom Azure app instead of the default Activepieces app, follow the [Azure app creation guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app#register-an-application),
 set the **Redirect URI** to {{redirectUrl}} and add the following **Microsoft Graph (Delegated) permissions** under **API permissions**:
 - Sites.Read.All
 - Mail.Read
 - Files.ReadWrite.All
 - People.Read.All
 - OnlineMeetingTranscript.Read.All
 - Chat.Read
 - ChannelMessage.Read.All
 - ExternalItem.Read.All
 - AiEnterpriseInteraction.Read
 - Files.Read.All`;

export const microsoft365CopilotAuth = PieceAuth.OAuth2({
  description: authDesc,
  props: {
    cloud: microsoftCloudProperty,
  },
  authUrl: 'https://{cloud}/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://{cloud}/common/oauth2/v2.0/token',
  required: true,
  scope: [
    'Sites.Read.All',
    'Mail.Read',
    'Files.ReadWrite.All',
    'People.Read.All',
    'OnlineMeetingTranscript.Read.All',
    'Chat.Read',
    'ChannelMessage.Read.All',
    'ExternalItem.Read.All',
    'AiEnterpriseInteraction.Read',
    'Files.Read.All',
  ],
  prompt: 'omit',
});
