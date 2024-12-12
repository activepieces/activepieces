
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { OAuth2GrantType } from '@activepieces/shared';
    import { getInvoices } from './lib/actions/get-invoices';

  export const googleSheetsAuth = PieceAuth.OAuth2({
    description: '',
  
    authUrl: 'https://accounts.google.com/o/oauth2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    required: true,
    scope: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive',
    ],
  });

  export const githubAuth = PieceAuth.OAuth2({
    required: true,
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scope: ['admin:repo_hook', 'admin:org', 'repo'],
  });

  export const WOOTRIC_API_URL = 'https://id.getharvest.com/api/v2';
  export const wootricAuth = PieceAuth.OAuth2({
    required: true,
    grantType: OAuth2GrantType.AUTHORIZATION_CODE,
    authUrl: 'https://id.getharvest.com/oauth2/authorize',
    tokenUrl: `https://id.getharvest.com/api/v2/oauth2/token`,
    scope: ['harvest:all'],
  });

    export const harvest = createPiece({
      displayName: "Harvest",
      auth: wootricAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/harvest.png",
      authors: ["drowe"],
      actions: [getInvoices],
      triggers: [],
    });
    