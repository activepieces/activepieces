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
import { tableauAuth } from './lib/auth';

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
    