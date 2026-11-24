import { PieceAuth, Property } from '@activepieces/pieces-framework';

const authDesc = `
If you'd like to use your own custom Azure app instead of the default app, follow the [Azure app creation guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app#register-an-application),
 set the **Redirect URI** to {{redirectUrl}} and add the following **Microsoft Graph (Delegated) permissions** under **API permissions**:
 - Group.Read.All
 - Tasks.ReadWrite
 - User.Read
 - User.ReadBasic.All`;

const microsoftCloudProperty = Property.StaticDropdown({
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

export const microsoft365PlannerAuth = PieceAuth.OAuth2({
  description: authDesc,
  props: {
    cloud: microsoftCloudProperty,
  },
  authUrl: 'https://{cloud}/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://{cloud}/common/oauth2/v2.0/token',
  required: true,
  scope: [
    'Tasks.ReadWrite',
    'User.Read',
    'User.ReadBasic.All',
    'Group.Read.All',
    'openid',
    'email',
    'profile',
    'offline_access',
  ],
  prompt: 'omit',
});
