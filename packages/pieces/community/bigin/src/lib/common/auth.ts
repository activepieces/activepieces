import { PieceAuth, createPiece } from '@activepieces/pieces-framework';

export const biginAuth = PieceAuth.OAuth2({
  description: 'Authenticate with your Bigin account',
  authUrl: 'https://accounts.zoho.in/oauth/v2/auth',
  tokenUrl: 'https://accounts.zoho.in/oauth/v2/token',
  required: true,
  scope: [
    'ZohoBigin.notifications.ALL',
    'ZohoBigin.notifications.WRITE',
    'ZohoBigin.notifications.CREATE',
    'ZohoBigin.notifications.DELETE',

    'ZohoBigin.modules.ALL',
    'ZohoBigin.modules.contacts.ALL',
    'ZohoBigin.modules.contacts.READ',
    'ZohoBigin.modules.contacts.CREATE',

    'ZohoBigin.modules.pipelines.ALL',
    'ZohoBigin.modules.pipelines.READ',
    'ZohoBigin.modules.pipelines.CREATE',
  
    'ZohoBigin.modules.accounts.ALL',
    'ZohoBigin.modules.accounts.READ',
    'ZohoBigin.modules.accounts.CREATE',

    'ZohoBigin.modules.products.ALL',
    'ZohoBigin.modules.products.READ',
    'ZohoBigin.modules.products.CREATE',

    'ZohoBigin.modules.tasks.ALL',
    'ZohoBigin.modules.tasks.READ',
    'ZohoBigin.modules.tasks.CREATE',

    'ZohoBigin.modules.events.ALL',
    'ZohoBigin.modules.events.READ',
    'ZohoBigin.modules.events.CREATE',

    'ZohoBigin.modules.calls.ALL',
    'ZohoBigin.modules.calls.READ',
    'ZohoBigin.modules.calls.CREATE',
  ],
  extra: {
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
  },
});
