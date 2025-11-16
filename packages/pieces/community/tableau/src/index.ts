import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { downloadView } from './lib/actions/download-view';
import { runExtractRefreshTask } from './lib/actions/run-extract-refresh-task';
import { refreshWorkbook } from './lib/actions/refresh-workbook';
import { findView } from './lib/actions/find-view';
import { findWorkbook } from './lib/actions/find-workbook';
import { workbookEventTrigger } from './lib/triggers/workbook-events';
import { workbookRefreshEventTrigger } from './lib/triggers/workbook-refresh-events';
import { datasourceEventTrigger } from './lib/triggers/datasource-events';
import { datasourceRefreshEventTrigger } from './lib/triggers/datasource-refresh-events';
import { userDeletedTrigger } from './lib/triggers/user-deleted';
import { viewDeletedTrigger } from './lib/triggers/view-deleted';
import { labelEventTrigger } from './lib/triggers/label-events';
import { newJobTrigger } from './lib/triggers/new-job';
import { listExtractRefreshTasksTrigger } from './lib/triggers/list-extract-refresh-tasks';

const markdown = `
## Tableau Authentication Setup

### For Tableau Cloud:
- **Server URL**: Use your Tableau Cloud URL (e.g., https://10az.online.tableau.com or https://us-east-1.online.tableau.com)
- **Site Content URL**: Your site name (leave empty for default site)

### For Tableau Server:
- **Server URL**: Your Tableau Server URL (e.g., https://tableau.yourcompany.com)
- **Site Content URL**: Your site name (leave empty for default site)

### Authentication Methods:
Choose **either** Username/Password **or** Personal Access Token:

#### Option 1: Username and Password
- Enter your Tableau username and password
- For Tableau Cloud, use your email address as username
- For Tableau Server, use your domain\\username if using Active Directory

#### Option 2: Personal Access Token (Recommended)
- Go to your Tableau account settings
- Generate a Personal Access Token
- Enter the token name and secret

**Security Note:** Personal Access Tokens are recommended for production use as they provide better security and can be revoked individually.
`;

export const tableauAuth = PieceAuth.CustomAuth({
  description: markdown,
  required: true,
  props: {
    serverUrl: Property.ShortText({
      displayName: 'Server URL',
      description: 'Your Tableau Server or Tableau Cloud URL (e.g., https://10az.online.tableau.com)',
      required: true,
    }),
    apiVersion: Property.ShortText({
      displayName: 'API Version',
      description: 'Tableau REST API version (e.g., 3.19, 3.20, 3.26). Check your Tableau server documentation for supported versions. Use 3.26 for most Tableau Cloud instances.',
      required: true,
      defaultValue: '3.26',
    }),
    siteContentUrl: Property.ShortText({
      displayName: 'Site Content URL',
      description: 'Your Tableau site name (leave empty for default site)',
      required: false,
    }),
    // Username/Password authentication
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Your Tableau username (email for Tableau Cloud, or domain\\username for Server)',
      required: false,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Your Tableau password',
      required: false,
    }),
    // PAT authentication
    personalAccessTokenName: Property.ShortText({
      displayName: 'Personal Access Token Name',
      description: 'Name of your Personal Access Token',
      required: false,
    }),
    personalAccessTokenSecret: PieceAuth.SecretText({
      displayName: 'Personal Access Token Secret',
      description: 'Secret value of your Personal Access Token',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    const hasUsernamePassword = auth.username && auth.password;
    const hasPersonalAccessToken = auth.personalAccessTokenName && auth.personalAccessTokenSecret;

    if (!hasUsernamePassword && !hasPersonalAccessToken) {
      return {
        valid: false,
        error: 'Either Username/Password or Personal Access Token must be provided.',
      };
    }

    if (hasUsernamePassword && hasPersonalAccessToken) {
      return {
        valid: false,
        error: 'Please provide either Username/Password OR Personal Access Token, not both.',
      };
    }

    return {
      valid: true,
    };
  },
});

export const tableau = createPiece({
  displayName: "Tableau",
  description: "Business intelligence and analytics platform for data visualization",
  auth: tableauAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/tableau.png",
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ["onyedikachi-david"],
  actions: [downloadView, runExtractRefreshTask, refreshWorkbook, findView, findWorkbook],
  triggers: [
    workbookEventTrigger,
    workbookRefreshEventTrigger,
    datasourceEventTrigger,
    datasourceRefreshEventTrigger,
    userDeletedTrigger,
    viewDeletedTrigger,
    labelEventTrigger,
    newJobTrigger,
    listExtractRefreshTasksTrigger,
  ],
});
    