import { createEnvelopeEventTrigger } from '../envelope-event-trigger';

export const recipientAuthenticationFailed = createEnvelopeEventTrigger({
  name: 'recipientAuthenticationFailed',
  displayName: 'Recipient Authentication Failed',
  description:
    'Triggers when a recipient fails the identity authentication check.',
  docusignEvent: 'recipient-authenticationfailed',
  sampleData: {
    envelopeId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    emailSubject: 'Please sign this document',
    recipients: {
      signers: [
        {
          name: 'John Smith',
          email: 'john.smith@example.com',
          recipientId: '1',
          status: 'authenticationfailed',
        },
      ],
    },
  },
});
