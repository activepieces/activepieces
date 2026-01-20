import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { waitwhileAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newOrUpdatedMessage = createTrigger({
  auth: waitwhileAuth,
  name: 'newOrUpdatedMessage',
  displayName: 'New Or Updated Message',
  description:
    'Triggers when an SMS or EMAIL notification is created or its delivery status changes',
  props: {},
  sampleData: {
    id: '0T6229ytZ6Ud3AS2OCsE',
    created: '2022-05-16T20:41:36.627Z',
    accountId: 'itiTKblwsrcJsAxO8kFz',
    type: 'message.created',
    data: {
      id: 'dIaq4Ek6xoxnveDBDocI',
      channel: 'SMS',
      providerId: 'TWILIO',
      isExternalProvider: false,
      providerAccountId: null,
      recipient: 'guest@email.com',
      recipientName: 'Email Test',
      sender: 'waitlist@v2-email.waitwhile.com',
      senderName: 'My Waitlist',
      locationId: 'dnVVslEybbg4SQmCw9kg',
      customerId: 'vdeDJPsfRQppoAJclB1Kqd',
      externalCustomerId: null,
      visitId: 'mmKbn1nxOcXG5PUZ80K3',
      userId: null,
      type: 'WAITLIST-ALERT',
      body: '<p>Hi Email!</p>\n<p>An Academic Advisor is now preparing your file and awaiting your return, please check in with the Secretary when you arrive.\nIf you cannot make it, please <a href="https://waitwhile.com/l/mywaitlist2/mmKbn1">cancel yourself</a>.</p>\n<p>We look forward to seeing you soon!</p>\n<p><em>My Waitlist</em></p>\n',
      externalId: null,
      isIncoming: false,
      isAnonymized: false,
      isRead: true,
      state: 'PENDING',
      updated: '2022-05-16T20:41:36.231Z',
      created: '2022-05-16T20:41:36.197Z',
      updatedBy: 'RUlfUPgKD3NVd7YFIc8sYImlZIf1',
      createdBy: 'RUlfUPgKD3NVd7YFIc8sYImlZIf1',
      subject: "It's your turn at My Waitlist",
      templateId: 'guest-alert',
      substitutions: {
        showEmailConfirmationLink: false,
        messageType: 'WAITLIST-ALERT',
        clientHostname: 'app.waitwhile.com',
        publicClientHostname: 'waitwhile.com',
        locationId: 'dnVVslEybbf5FQmCw9kg',
        businessName: 'My Waitlist',
        waitlistId: 'mywaitlist',
        shortName: 'mywaitlist',
        showBranding: true,
        replyTo: 'waitlist@v2-email.waitwhile.com,email@email.com',
        publicId: 'mmKbn1',
        isBooking: false,
        qrCodeImageLink:
          'https://api.waitwhile.com/v2/public/visits/mywaitlist2/mmKbn1/qrcode',
        body: '<p>Hi Email!</p>\n<p>An Academic Advisor is now preparing your file and awaiting your return, please check in with the Secretary when you arrive.\nIf you cannot make it, please <a href="https://waitwhile.com/l/mywaitlist2/mmKbn1">cancel yourself</a>.</p>\n<p>We look forward to seeing you soon!</p>\n<p><em>My Waitlist</em></p>\n',
        message:
          '<p>Hi Email!</p>\n<p>An Academic Advisor is now preparing your file and awaiting your return, please check in with the Secretary when you arrive.\nIf you cannot make it, please <a href="https://waitwhile.com/l/mywaitlist2/mmKbn1">cancel yourself</a>.</p>\n<p>We look forward to seeing you soon!</p>\n<p><em>My Waitlist</em></p>\n',
        subject: "It's your turn at My Waitlist",
        sendingDomain: 'v2-email.waitwhile.com',
      },
      numSegments: 1,
      accountId: 'itiDKblwIrcJZ1AxO8kFz',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const api_key = context.auth.secret_text;
    const webhookUrl = context.webhookUrl;

    const body = {
      url: webhookUrl,
      eventTypes: ['message.created', 'message.updated'],
    };

    const response = (await makeRequest(
      api_key,
      HttpMethod.POST,
      '/webhooks',
      body
    )) as any;
    await context.store.put('webhookId', response.id);
  },
  async onDisable(context) {
    const api_key = context.auth.secret_text;
    const webhookId = await context.store.get('webhookId');

    if (webhookId) {
      await makeRequest(api_key, HttpMethod.DELETE, `/webhooks/${webhookId}`);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
