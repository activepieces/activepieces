import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { newLead } from './lib/triggers/new-lead';

export const facebookLeadsAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://graph.facebook.com/oauth/authorize',
  tokenUrl: 'https://graph.facebook.com/oauth/access_token',
  required: true,
  scope: [
    'pages_show_list',
    'pages_manage_ads',
    'leads_retrieval',
    'pages_manage_metadata',
  ],
});

export const facebookLeads = createPiece({
  displayName: 'Facebook Leads',
  description: 'Capture leads from Facebook',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/facebook.png',
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud","AbdulTheActivePiecer"],
  categories: [PieceCategory.MARKETING],
  auth: facebookLeadsAuth,
  actions: [],
  triggers: [newLead],
  events: {
    parseAndReply: (context) => {
      const payload = context.payload;
      const payloadBody = payload.body as PayloadBody;
      if (payload.queryParams['hub.verify_token'] == 'activepieces') {
        return {
          reply: {
            body: payload.queryParams['hub.challenge'],
            headers: {},
          },
        };
      }
      return {
        event: 'lead',
        identifierValue: payloadBody.entry[0].changes[0].value.page_id,
      };
    },
    verify: () => {
      // TODO IMPLEMENT VALIDATION AFTER APP VERIFICATION
      return true;
    },
  },
});

type PayloadBody = {
  entry: {
    changes: {
      value: {
        page_id: string;
      };
    }[];
  }[];
};
