import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { PieceAuth, Property, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory, tryCatch } from '@activepieces/shared';
import { sendEmail } from './lib/actions/send-email';
import { validateEmail } from './lib/actions/validate-email';
import { addMailingListMember } from './lib/actions/add-mailing-list-member';
import { getEvents } from './lib/actions/get-events';
import { getDomainStats } from './lib/actions/get-domain-stats';
import { listBounces } from './lib/actions/list-bounces';
import { newBounceEvent } from './lib/triggers/new-bounce-event';
import { newComplaintEvent } from './lib/triggers/new-complaint-event';
import { newDeliveryEvent } from './lib/triggers/new-delivery-event';
import { newFailedDeliveryEvent } from './lib/triggers/new-failed-delivery-event';
import { newOpenEvent } from './lib/triggers/new-open-event';
import { newClickEvent } from './lib/triggers/new-click-event';
import { newUnsubscribeEvent } from './lib/triggers/new-unsubscribe-event';

export const mailgunAuth = PieceAuth.CustomAuth({
  displayName: 'Mailgun Connection',
  required: true,
  description: `To get your API key:
1. Log in to your [Mailgun dashboard](https://app.mailgun.com)
2. Go to **Settings > API Security**
3. Copy your **Private API Key** (starts with \`key-\`)`,
  props: {
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Mailgun private API key (starts with `key-`)',
      required: true,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      description:
        'Select the region your Mailgun account is in. Most accounts use US.',
      required: true,
      defaultValue: 'us',
      options: {
        options: [
          { label: 'US', value: 'us' },
          { label: 'EU', value: 'eu' },
        ],
      },
    }),
  },
  validate: async ({ auth }) => {
    const baseUrl =
      auth.region === 'eu'
        ? 'https://api.eu.mailgun.net'
        : 'https://api.mailgun.net';
    const { error } = await tryCatch(() =>
      httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/v3/domains`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: 'api',
          password: auth.api_key,
        },
        queryParams: { limit: '1' },
      }),
    );
    if (error) {
      return {
        valid: false,
        error: 'Invalid API key or region. Please check your credentials and try again.',
      };
    }
    return { valid: true };
  },
});

export const mailgun = createPiece({
  displayName: 'Mailgun',
  description:
    'Email delivery service for sending, receiving, and tracking emails',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/mailgun.png',
  categories: [PieceCategory.MARKETING, PieceCategory.COMMUNICATION],
  auth: mailgunAuth,
  authors: ['bst1n', 'onyedikachi-david'],
  actions: [
    sendEmail,
    validateEmail,
    addMailingListMember,
    getEvents,
    getDomainStats,
    listBounces,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        return auth?.props.region === 'eu'
          ? 'https://api.eu.mailgun.net/v3'
          : 'https://api.mailgun.net/v3';
      },
      auth: mailgunAuth,
      authMapping: async (auth) => {
        return {
          Authorization: `Basic ${Buffer.from(`api:${auth.props.api_key}`).toString('base64')}`,
        };
      },
    }),
  ],
  triggers: [
    newBounceEvent,
    newComplaintEvent,
    newDeliveryEvent,
    newFailedDeliveryEvent,
    newOpenEvent,
    newClickEvent,
    newUnsubscribeEvent,
  ],
});
