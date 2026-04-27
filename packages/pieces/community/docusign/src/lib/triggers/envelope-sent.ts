import { createEnvelopeEventTrigger } from '../envelope-event-trigger';

export const envelopeSent = createEnvelopeEventTrigger({
  name: 'envelopeSent',
  displayName: 'Signing Request Sent',
  description:
    'Triggers when a signing request is emailed out to recipients for the first time.',
  docusignEvent: 'envelope-sent',
  sampleData: {
    event: 'envelope-sent',
    apiVersion: 'v2.1',
    uri: '/restapi/v2.1/accounts/6544471c-xxx-xxx-xxxx-39bb8a61f598/envelopes/b31128f9-xxxx-xxxx-xxx-7835d84310f5',
    retryCount: 0,
    configurationId: 22127522,
    generatedDateTime: '2026-04-17T06:52:37.9980000Z',
    data: {
      accountId: '6544471c-xxx-xxx-xxxx-39bb8a61f598',
      userId: '7063cf65-xxx-xxxx-xxxx-ba5ba6bc213b',
      envelopeId: 'b31128f9-xxxx-xxx-xx-xxxx',
    },
  },
});
