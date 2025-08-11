
import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { DATA_CENTER_REGIONS } from "./lib/common/constants";
import { getZohoBiginAccountAuthorizationUrl } from "./lib/common/helpers";
import { newContactCreated } from "./lib/triggers/new-contact-created";
import { PieceCategory } from "@activepieces/shared";
import { companyUpdated } from "./lib/triggers/company-updated";
import { contactUpdated } from "./lib/triggers/contact-updated";
import { newCallCreated } from "./lib/triggers/new-call-created";
import { newCompanyCreated } from "./lib/triggers/new-company-created";
import { newTaskCreated } from "./lib/triggers/new-task-created";
import { newEventCreated } from "./lib/triggers/new-event-created";
import { newPipelineRecordCreated } from "./lib/triggers/new-pipeline-record";
import { pipelineRecordUpdated } from "./lib/triggers/pipeline-record-updated";
import { createCompany } from "./lib/actions/create-company";
import { updateCompany } from "./lib/actions/update-company";
import { createContact } from "./lib/actions/create-contact";
import { updateContact } from "./lib/actions/update-contact";
import { createTask } from "./lib/actions/create-task";
import { updateTask } from "./lib/actions/update-task";
import { createCall } from "./lib/actions/create-call";
import { biginApiService } from "./lib/common/request";
import { createEvent } from "./lib/actions/create-event";
import { updateEvent } from "./lib/actions/update-event";
import { createPipelineRecord } from "./lib/actions/create-pipeline-record";
import { updatePipelineRecord } from "./lib/actions/update-pipeline-record";
import { searchPipelineRecord } from "./lib/actions/search-pipeline-records";
import { searchCompanyRecord } from "./lib/actions/search-company-record";
import { searchContactRecord } from "./lib/actions/search-contact-record";
import { searchProductRecord } from "./lib/actions/search-product";
import { searchUser } from "./lib/actions/search-user";

export const biginAuth = PieceAuth.OAuth2({
  description: `
Authenticate with Zoho Bigin via OAuth2.  
[Read the official Zoho guide here](https://www.bigin.com/developer/docs/apis/v2/register-client.html).

1. Log into the [Zoho API Console](https://api-console.zoho.com/).  
2. Click **+ ADD CLIENT** and choose **Server-based Applications**.  
3. Fill in the required details:
   - **Client Name:** Your app name (letters, numbers, underscores \`_\` or ampersands \`&\` only).
   - **Homepage URL:** Your app's homepage (e.g. https://cloud.activepieces.com).
   - **Authorized Redirect URIs:** **https://cloud.activepieces.com/redirect**  
4. Click **Create** and copy the **Client ID** and **Client Secret**.  
5. Back here, select your **Data Center Region**, enter the Client ID & Client Secret, and click **Connect**.
`,
  authUrl: '{domain}/oauth/v2/auth',
  tokenUrl: '{domain}/oauth/v2/token',
  required: true,
  scope: [
    'ZohoBigin.modules.ALL',
    'ZohoBigin.settings.ALL',
    'ZohoBigin.users.ALL',
    'ZohoBigin.notifications.ALL',
    'ZohoSearch.securesearch.READ',
  ],
  props: {
    domain: Property.StaticDropdown({
      displayName: 'Your Data Center Region',
      description: 'Select your Zoho data center region for your account',
      required: true,
      options: {
        options: DATA_CENTER_REGIONS.map((region) => ({
          label: region.LABEL,
          value: getZohoBiginAccountAuthorizationUrl(region.REGION),
        })),
      },
      defaultValue: getZohoBiginAccountAuthorizationUrl(
        DATA_CENTER_REGIONS[0].REGION
      ),
    }),
  },
  validate: async ({ auth, server }) => {
    const { domain } = auth.props as any;
    if (!domain) {
      return {
        valid: false,
        error: 'Please select your data center region.',
      };
    }

    try {
      // Map selected Accounts domain to the correct API domain for validation
      const region = DATA_CENTER_REGIONS.find(
        (r) => r.ACCOUNTS_DOMAIN === domain || getZohoBiginAccountAuthorizationUrl(r.REGION) === domain
      );
      const apiDomain = region?.API_DOMAIN ?? 'https://www.zohoapis.com';
      await biginApiService.fetchModules(auth.access_token, apiDomain);
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Could not validate OAuth credentials. please check your Client ID, Secret, and Region.',
      };
    }
  },
});

export const biginByZoho = createPiece({
  displayName: 'Bigin-by-zoho',
  description:
    'Bigin by Zoho CRM is a lightweight CRM designed for small businesses to manage contacts, companies, deals (pipeline records), tasks, calls, and events.',
  auth: biginAuth,
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.SALES_AND_CRM],
  logoUrl: 'https://cdn.activepieces.com/pieces/bigin-by-zoho.png',
  authors: ['gs03dev'],
  actions: [
    createCompany,
    updateCompany,
    createContact,
    updateContact,
    createTask,
    updateTask,
    createCall,
    createEvent,
    updateEvent,
    createPipelineRecord,
    updatePipelineRecord,
    searchPipelineRecord,
    searchCompanyRecord,
    searchContactRecord,
    searchProductRecord,
    searchUser
  ],
  triggers: [
    newContactCreated, 
    contactUpdated,
    newCompanyCreated,
    companyUpdated,
    newCallCreated,
    newTaskCreated,
    newEventCreated,
    newPipelineRecordCreated,
    pipelineRecordUpdated,
  ],
});
