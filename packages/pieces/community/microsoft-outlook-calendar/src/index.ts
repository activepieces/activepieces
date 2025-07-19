import {
  createPiece,
  OAuth2PropertyValue,
  PieceAuth,
} from '@ensemble/pieces-framework';
import { createEventAction } from './lib/actions/create-event';
import { listEventsAction } from './lib/actions/list-events';
import { createCustomApiCallAction } from '@ensemble/pieces-common';
import { outlookCalendarCommon } from './lib/common/common';
import { deleteEventAction } from './lib/actions/delete-event';
import { PieceCategory } from '@ensemble/shared';

export const outlookCalendarAuth = PieceAuth.OAuth2({
  description: 'Authentication for Microsoft Outlook',
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  required: true,
  scope: ['User.Read', 'Calendars.ReadWrite', 'offline_access'],
});

export const microsoftOutlookCalendar = createPiece({
  displayName: "Microsoft Outlook Calendar",
  description: 'Calendar software by Microsoft',
  auth: outlookCalendarAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: "https://cdn.ensemble.com/pieces/microsoft-outlook.png",
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['antonyvigouret'],
  actions: [
    createEventAction,
    deleteEventAction,
    listEventsAction,
    createCustomApiCallAction({
      auth: outlookCalendarAuth,
      baseUrl() {
        return outlookCalendarCommon.baseUrl;
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
