import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { assertPublicInstanceUrl, VtigerApiError } from './rest-client';
import { vtwsLogin } from './vtws';

const markdownProperty = `
To obtain your Access Key, follow these steps:

1. Login to Vtiger CRM:
Open a web browser and log in to your Vtiger CRM instance.

2. Navigate to User Profile:
In the top right corner, click on your profile name.
Select "My Preferences."

3. The system will generate an access key for you.
Copy and securely store the access key. This key will be used for authentication when making API requests.
Note:

Access keys are sensitive information, and they should be kept secure.
Treat the access key like a password. Do not share it publicly or expose it in an insecure manner.
`;

export const vtigerAuth = PieceAuth.CustomAuth({
  description: markdownProperty,
  props: {
    instance_url: Property.ShortText({
      displayName: 'VTiger Instance URL',
      description:
        'For the instance URL, add the url without the endpoint. For example enter https://<instance>.od2.vtiger.com instead of https://<instance>.od2.vtiger.com/restapi/v1/vtiger/default',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Enter your username/email',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Access Key',
      description: 'Enter your access Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      assertPublicInstanceUrl(auth.instance_url);
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : String(error) };
    }
    try {
      await vtwsLogin(auth);
      return { valid: true };
    } catch (error) {
      if (error instanceof VtigerApiError) {
        return {
          valid: false,
          error: `Vtiger rejected the login (${error.message}). Check the username and access key.`,
        };
      }
      return {
        valid: false,
        error: `Could not reach the Vtiger instance: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
  required: true,
});
