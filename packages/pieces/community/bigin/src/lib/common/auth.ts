import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const biginAuth = PieceAuth.OAuth2({
  props: {
    location: Property.StaticDropdown({
      displayName: 'Location',
      description: 'The location of your Zoho CRM account',
      required: true,
      options: {
        options: [
          {
            label: 'zoho.eu (Europe)',
            value: 'eu',
          },
          {
            label: 'zoho.com (United States)',
            value: 'com',
          },
          {
            label: 'zoho.com.au (Australia)',
            value: 'com.au',
          },
          {
            label: 'zoho.jp (Japan)',
            value: 'jp',
          },
          {
            label: 'zoho.in (India)',
            value: 'in',
          },
          {
            label: 'zohocloud.ca (Canada)',
            value: 'zohocloud.ca',
          },
        ],
      },
    }),
  },
  description: 'Authenticate with your Bigin account',
  authUrl: 'https://accounts.zoho.{location}/oauth/v2/auth',
  tokenUrl: 'https://accounts.zoho.{location}/oauth/v2/token',
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
