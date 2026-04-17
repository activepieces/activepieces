import { EnvelopesApi } from 'docusign-esign';

import { createAction, Property } from '@activepieces/pieces-framework';

import { docusignAuth } from '../auth';
import { createApiClient } from '../common';

export const updateEnvelope = createAction({
  auth: docusignAuth,
  name: 'updateEnvelope',
  displayName: 'Update Signing Request',
  description:
    'Send a draft, cancel, resend reminders, or edit the subject line on a signing request.',
  props: {
    accountId: Property.ShortText({
      displayName: 'Account ID',
      required: true,
    }),
    envelopeId: Property.ShortText({
      displayName: 'Envelope ID',
      required: true,
    }),
    operation: Property.StaticDropdown({
      displayName: 'Operation',
      required: true,
      options: {
        options: [
          {
            label: 'Send Draft',
            value: 'send',
          },
          {
            label: 'Void Envelope',
            value: 'void',
          },
          {
            label: 'Resend to Recipients',
            value: 'resend',
          },
          {
            label: 'Update Email Subject / Message',
            value: 'updateEmail',
          },
        ],
      },
    }),
    voidedReason: Property.ShortText({
      displayName: 'Void Reason',
      description:
        'Required when operation is "Void Envelope". Explain why the envelope is being voided.',
      required: false,
    }),
    emailSubject: Property.ShortText({
      displayName: 'Email Subject',
      description:
        'Required when operation is "Update Email Subject / Message". New subject line for the signing email.',
      required: false,
    }),
    emailBlurb: Property.LongText({
      displayName: 'Email Message',
      description:
        'Used when operation is "Update Email Subject / Message". New body text for the signing email.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const apiClient = await createApiClient(auth);
    const envelopeApiClient = new EnvelopesApi(apiClient);

    const { accountId, envelopeId, operation } = propsValue;

    switch (operation) {
      case 'send':
        return await envelopeApiClient.update(accountId, envelopeId, {
          envelope: { status: 'sent' },
        });

      case 'void':
        return await envelopeApiClient.update(accountId, envelopeId, {
          envelope: {
            status: 'voided',
            voidedReason: propsValue.voidedReason ?? '',
          },
        });

      case 'resend':
        return await envelopeApiClient.update(accountId, envelopeId, {
          resendEnvelope: 'true',
          envelope: {},
        });

      case 'updateEmail':
        return await envelopeApiClient.update(accountId, envelopeId, {
          envelope: {
            emailSubject: propsValue.emailSubject ?? '',
            emailBlurb: propsValue.emailBlurb ?? '',
          },
        });

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  },
});
