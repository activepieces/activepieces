import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { microsoftCloudProperty, getGraphBaseUrl, getMicrosoftCloudFromAuth } from './lib/common/microsoft-cloud';
import {
  createPiece,
  OAuth2PropertyValue,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createEventAction } from './lib/actions/create-event';
import { deleteEventAction } from './lib/actions/delete-event';
import { listEventsAction } from './lib/actions/list-events';
import { outlookCalendarCommon } from './lib/common/common';

const authDesc = `
If you’d like to use your own custom Azure app instead of the default Activepieces app, follow the [Azure app creation guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app#register-an-application),
 set the **Redirect URI** to {{redirectUrl}} and add the following **Microsoft Graph (Delegated) permissions** under **API permissions**:
 - User.Read
 - Calendars.ReadWrite
 - offline_access`;

export const outlookCalendarAuth = PieceAuth.OAuth2({
  description: authDesc,
  props: {
    cloud: microsoftCloudProperty,
  },
  authUrl: 'https://{cloud}/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://{cloud}/common/oauth2/v2.0/token',
  required: true,
  scope: ['User.Read', 'Calendars.ReadWrite', 'offline_access'],
  prompt: 'omit',
});

export const microsoftOutlookCalendar = createPiece({
  displayName: 'Microsoft Outlook Calendar',
  description: 'Calendar software by Microsoft',
  auth: outlookCalendarAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-outlook.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['antonyvigouret'],
  actions: [
    createEventAction,
    deleteEventAction,
    listEventsAction,
    createCustomApiCallAction({
      auth: outlookCalendarAuth,
      baseUrl(auth) {
        const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
        return outlookCalendarCommon.getBaseUrl(cloud);
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        };
      },
    }),
  ],
  triggers: [],
});
