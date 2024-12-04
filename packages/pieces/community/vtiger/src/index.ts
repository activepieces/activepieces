import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createRecord } from './lib/actions/create-record';
import { deleteRecord } from './lib/actions/delete-record';
import { getRecord } from './lib/actions/get-record';
import { makeAPICall } from './lib/actions/make-api-call';
import { searchRecords } from './lib/actions/search-record';
import { updateRecord } from './lib/actions/update-record';
import { instanceLogin, isBaseUrl } from './lib/common';
import { newOrUpdatedRecord } from './lib/triggers/new-or-updated-record';
import { queryRecords } from './lib/actions/query-records';

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
    const { instance_url, username, password } = auth;

    try {
      if (!isBaseUrl(instance_url)) {
        return {
          valid: false,
          error:
            'Please ensure that the website is valid and does not contain any paths, for example, https://<instance>.od2.vtiger.com  ',
        };
      }
      if (instance_url.endsWith('/')) {
        return {
          valid: false,
          error:
            'Please enter the URL without a trailing slash. E.g. https://<instance>.od2.vtiger.com instead of https://<instance>.od2.vtiger.com/',
        };
      }
      if (instance_url.includes('restapi/')) {
        return {
          valid: false,
          error:
            'Add the url without the endpoint. For example add https://<instance>.od2.vtiger.com/ instead of https://<instance>.od2.vtiger.com/restapi/v1/vtiger/default',
        };
      }

      const instance = await instanceLogin(instance_url, username, password);
      if (!instance) {
        return {
          valid: false,
          error: 'Invalid credentials, check and try again.',
        };
      }

      return {
        valid: true,
      };
    } catch (err) {
      return {
        valid: false,
        error: 'Unexpected error. Please check your credentials and try again.',
      };
    }
  },
  required: true,
});

export const vtiger = createPiece({
  displayName: 'Vtiger',
  description: 'CRM software for sales, marketing, and support teams',
  auth: vtigerAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/vtiger.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ["kanarelo","kishanprmr","abuaboud"],
  actions: [
    createRecord,
    getRecord,
    updateRecord,
    deleteRecord,
    queryRecords,
    searchRecords,
    makeAPICall,
  ],
  triggers: [newOrUpdatedRecord],
});
