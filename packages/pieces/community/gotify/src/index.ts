import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createApplication } from './lib/actions/create-application';
import { deleteApplication } from './lib/actions/delete-application';
import { deleteApplicationMessages } from './lib/actions/delete-application-messages';
import { deleteMessage } from './lib/actions/delete-message';
import { getCurrentUser } from './lib/actions/get-current-user';
import { getServerHealth } from './lib/actions/get-server-health';
import { listApplications } from './lib/actions/list-applications';
import { listClients } from './lib/actions/list-clients';
import { listMessages } from './lib/actions/list-messages';
import { sendNotification } from './lib/actions/send-notification';
import { updateApplication } from './lib/actions/update-application';
import { gotifyAuth } from './lib/auth';
import { gotifyClient } from './lib/common/client';

export const gotify = createPiece({
  displayName: 'Gotify',
  description: 'Self-hosted push notification service',
  logoUrl: 'https://cdn.activepieces.com/pieces/gotify.png',
  minimumSupportedRelease: '0.88.2',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['MyWay', 'kishanprmr', 'khaledmashaly', 'abuaboud'],
  auth: gotifyAuth,
  actions: [
    sendNotification,
    listMessages,
    deleteMessage,
    deleteApplicationMessages,
    listApplications,
    createApplication,
    updateApplication,
    deleteApplication,
    listClients,
    getCurrentUser,
    getServerHealth,
    createCustomApiCallAction({
      auth: gotifyAuth,
      baseUrl: (auth) => (auth ? gotifyClient.normalizeBaseUrl(auth.props.base_url) : ''),
      authMapping: async (auth, propsValue) => {
        const baseUrl = gotifyClient.normalizeBaseUrl(auth.props.base_url);
        const urlProp = propsValue['url'];
        const url = gotifyClient.isRecord(urlProp) && typeof urlProp['url'] === 'string' ? urlProp['url'].trim() : '';
        if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) {
          if (!gotifyClient.isSameOrigin({ url, baseUrl })) {
            throw new Error('The URL must be on the Gotify Server URL of the connection.');
          }
        }
        if (url.split(/[/?#]/).some((part) => part === '..')) {
          throw new Error('The URL must not contain ".." segments.');
        }
        return { 'X-Gotify-Key': gotifyClient.clientTokenOf(auth.props) };
      },
    }),
  ],
  triggers: [],
});
