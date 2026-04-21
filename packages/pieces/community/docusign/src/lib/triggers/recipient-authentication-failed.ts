import { createEnvelopeEventTrigger } from '../envelope-event-trigger';

export const recipientAuthenticationFailed = createEnvelopeEventTrigger({
  name: 'recipientAuthenticationFailed',
  displayName: 'Person Failed Identity Check',
  description:
    'Triggers when a recipient fails the identity verification step before signing.',
  docusignEvent: 'recipient-authenticationfailed',
  sampleData: {
    event: 'recipient-authenticationfailed',
    apiVersion: 'v2.1',
    uri: '/restapi/v2.1/accounts/6544471c-xxx-xxxx-xxxx-xxxb8a61f598/envelopes/f83f22a4-xxx-xxx-xxx-a039b5451096',
    retryCount: 0,
    configurationId: 22127526,
    generatedDateTime: '2026-04-17T06:58:23.7089453Z',
    data: {
      accountId: '6544471c-xxx-xxxx-xxxx-xxxb8a61f598',
      userId: '7063cf65-xxxx-xxx-xx-xxxxxx',
      envelopeId: 'f83f22a4-xxx-xxx-xxx-a039b5451096',
      recipientId: '1',
    },
  },
});
