import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocAiProps } from '../common/ai-props';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';

export const createSigningLink = createAction({
  auth: pandadocAuth,
  name: 'create_signing_link',
  classification: 'WRITE',
  displayName: 'Create Signing Link',
  description: 'Creates a temporary link a recipient can open to view and sign a sent document.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a temporary signing session link for one recipient (by email) of a PandaDoc document that has already been sent (silent send is fine). Share the URL with that recipient only; it expires after Lifetime seconds (default 3600). Each call creates a new session.',
    idempotent: false,
  },
  props: {
    document_id: pandadocAiProps.documentId(),
    recipient_email: Property.ShortText({ displayName: 'Recipient Email', description: 'Must be a recipient of the document.', required: true }),
    lifetime: Property.Number({ displayName: 'Lifetime (Seconds)', description: 'How long the link stays valid. Default 3600 (1 hour).', required: false }),
  },
  outputSchema: pandadocSchemas['signingLink'],
  async run({ auth, propsValue }) {
    const lifetime = pandadocInputs.optionalNumber(propsValue.lifetime);
    if (lifetime !== undefined && (!Number.isInteger(lifetime) || lifetime < 1)) {
      throw new Error('Lifetime must be a whole number of seconds greater than 0.');
    }
    return pandadocApi.createSigningLink({
      apiKey: auth.secret_text,
      documentId: pandadocInputs.requiredString({ value: propsValue.document_id, label: 'Document ID' }),
      recipient: pandadocInputs.requiredString({ value: propsValue.recipient_email, label: 'Recipient Email' }),
      lifetime,
    });
  },
});
