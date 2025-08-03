
import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { DATA_CENTER_REGIONS, getZohoBiginAccountAuthorizationUrl } from "./lib/common/constants";

export const biginAuth = PieceAuth.OAuth2({
  description: 'Authenticate with Bigin by Zoho',
  authUrl: '{domain}/oauth/v2/auth',
  tokenUrl: '{domain}/oauth/v2/token',
  required: true,
  scope: [
    'ZohoBigin.modules.ALL',
    'ZohoBigin.settings.ALL',
    'ZohoBigin.users.ALL',
    'ZohoBigin.notifications.ALL'
  ],
  props: {
    dcRegion: Property.StaticDropdown({
      displayName: 'Your Data Center Region',
      description: 'Select your Zoho data center region for your account',
      required: true,
      options: {
        options: DATA_CENTER_REGIONS.map(region => ({
          label: region.LABEL,
          value: getZohoBiginAccountAuthorizationUrl(region.REGION)
        }))
      },
      defaultValue: DATA_CENTER_REGIONS[0].REGION
    })
  },
  validate: async ({ auth }) => {
    try {
      console.log(auth)
      return {
        valid: true
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid authentication credentials or insufficient permissions'
      };
    }
  }
});

export const biginByZoho = createPiece({
  displayName: "Bigin-by-zoho",
  description: "Bigin by Zoho CRM is a lightweight CRM designed for small businesses to manage contacts, companies, deals (pipeline records), tasks, calls, and events.",
  auth: biginAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/bigin-by-zoho.png",
  authors: ['gs03dev'],
  actions: [],
  triggers: [],
});
