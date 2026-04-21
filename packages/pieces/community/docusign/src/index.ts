import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { createApiClient } from './lib/common';
import { listEnvelopes } from './lib/actions/list-envelopes';
import { getEnvelope } from './lib/actions/get-envelope';
import { getDocument } from './lib/actions/get-document';
import { createAndSendEnvelope } from './lib/actions/create-and-send-envelope';
import { updateEnvelope } from './lib/actions/update-envelope';
import { listTemplates } from './lib/actions/list-templates';
import { findEnvelopeRecipients } from './lib/actions/find-envelope-recipients';
import { envelopeCompleted } from './lib/triggers/envelope-completed';
import { envelopeDeclined } from './lib/triggers/envelope-declined';
import { envelopeVoided } from './lib/triggers/envelope-voided';
import { envelopeCreated } from './lib/triggers/envelope-created';
import { envelopeSent } from './lib/triggers/envelope-sent';
import { envelopeDelivered } from './lib/triggers/envelope-delivered';
import { recipientSent } from './lib/triggers/recipient-sent';
import { recipientDelivered } from './lib/triggers/recipient-delivered';
import { recipientCompleted } from './lib/triggers/recipient-completed';
import { recipientDeclined } from './lib/triggers/recipient-declined';
import { recipientAuthenticationFailed } from './lib/triggers/recipient-authentication-failed';
import { docusignAuth } from './lib/auth';

export type DocusignAuthType = {
  clientId: string;
  privateKey: string;
  environment: 'demo' | 'www' | 'eu';
  impersonatedUserId: string;
  scopes: string;
};

export const docusign = createPiece({
  displayName: 'Docusign',
  auth: docusignAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/docusign.png',
  authors: ['AdamSelene', 'sanket-a11y'],
  actions: [
    listEnvelopes,
    getEnvelope,
    getDocument,
    createAndSendEnvelope,
    updateEnvelope,
    listTemplates,
    findEnvelopeRecipients,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        if (!auth) return '';
        return `https://${auth.props.environment}.docusign.net/restapi`;
      },
      auth: docusignAuth,
      authMapping: async (auth) => {
        const apiClient = await createApiClient(auth);
        return (apiClient as any).defaultHeaders;
      },
    }),
  ],
  triggers: [
    envelopeCreated,
    envelopeSent,
    envelopeDelivered,
    envelopeCompleted,
    envelopeDeclined,
    envelopeVoided,
    recipientSent,
    recipientDelivered,
    recipientCompleted,
    recipientDeclined,
    recipientAuthenticationFailed,
  ],
});
