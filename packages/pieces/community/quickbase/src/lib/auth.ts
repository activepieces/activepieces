import { PieceAuth, Property } from '@activepieces/pieces-framework';

const markdown = `
## Quickbase Authentication Setup

### 1. Get Your User Token
- Log in to your Quickbase account
- Go to **My Preferences** → **My User Information**
- Click on **Manage User Tokens**
- Click **New User Token**
- Enter a name for your token and click **Create**
- Copy the generated token (it will only be shown once)

### 2. Required Permissions
Your user token needs access to:
- Read/write permissions for the apps and tables you want to use
- Admin permissions for creating/deleting records (if needed)

**Security Note:** Keep your user token secure - it provides access to your Quickbase data.
`;

export const quickbaseAuth = PieceAuth.CustomAuth({
  description: markdown,
  required: true,
  props: {
    realmHostname: Property.ShortText({
      displayName: 'Realm Hostname',
      description: 'Enter your Quickbase Realm Hostname (e.g., yourrealm.quickbase.com)',
      required: true,
    }),
    userToken: Property.ShortText({
      displayName: 'User Token',
      description: 'Enter your Quickbase User Token',
      required: true,
    }),
  },
});
