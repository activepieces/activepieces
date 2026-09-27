import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlGiftCard,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCreateGiftCard = createAction({
  auth: shopifyAuth,
  name: 'create_gift_card',
  classification: 'WRITE',
  displayName: 'Create Gift Card',
  description: 'Issue a new gift card with an initial balance.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Issues a new gift card with an initial amount and returns it. The full redeemable code is returned ONLY by this call (as gift_card_code); every later read shows just the last characters, so hand the code to whoever needs it now. Leave code empty to let Shopify generate a random 16-character code. Optionally assign it to a customer, set an expiry date and an internal note, or schedule a notification email to a recipient customer with a message. Each call issues another gift card with real store value, so do not repeat it after a success. Plan availability of gift cards is to be confirmed on the store. Needs the write_gift_cards access scope.',
    idempotent: false,
  },
  props: {
    amount: Property.Number({
      displayName: 'Initial Amount',
      description: 'The starting balance, for example 50 for 50.00.',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'ISO currency code of the amount, for example "USD". Normally the shop currency.',
      required: true,
    }),
    code: Property.ShortText({
      displayName: 'Code',
      description:
        'Optional custom code customers type at checkout, letters and numbers only, for example "WELCOME2026GIFT". Leave empty for a random 16-character code.',
      required: false,
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Optional customer who owns the card, numeric or "gid://shopify/Customer/…".',
      required: false,
    }),
    expires_on: Property.ShortText({
      displayName: 'Expires On',
      description: 'Optional expiry date, YYYY-MM-DD, for example "2027-12-31". Leave empty for no expiry.',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Optional internal note, not shown to the customer.',
      required: false,
    }),
    recipient_customer_id: Property.ShortText({
      displayName: 'Recipient Customer ID',
      description:
        'Optional customer who receives the gift card notification, numeric or "gid://shopify/Customer/…". Needed for the recipient message and notification time.',
      required: false,
    }),
    recipient_preferred_name: Property.ShortText({
      displayName: 'Recipient Preferred Name',
      description: 'Optional name used to greet the recipient, for example "Sam".',
      required: false,
    }),
    recipient_message: Property.LongText({
      displayName: 'Recipient Message',
      description: 'Optional personal message included in the recipient notification.',
      required: false,
    }),
    send_notification_at: Property.DateTime({
      displayName: 'Send Notification At',
      description: 'Optional time to email the recipient, ISO 8601. Leave empty to send when Shopify processes it.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (!(propsValue.amount > 0)) {
      throw new Error('The initial amount must be above 0. Nothing was created.');
    }
    const currency = shopifyValues.nonEmpty(propsValue.currency)?.toUpperCase();
    if (!currency || !/^[A-Z]{3}$/.test(currency)) {
      throw new Error('Set currency to a 3-letter ISO code such as "USD". Nothing was created.');
    }
    const recipient = buildRecipient({
      recipientCustomerId: propsValue.recipient_customer_id,
      preferredName: propsValue.recipient_preferred_name,
      message: propsValue.recipient_message,
      sendNotificationAt: propsValue.send_notification_at,
    });
    const customerId = shopifyValues.nonEmpty(propsValue.customer_id);
    const input = shopifyValues.compact({
      initialAmount: { amount: String(propsValue.amount), currencyCode: currency },
      code: shopifyValues.nonEmpty(propsValue.code),
      customerId: customerId ? shopifyGraphqlClient.toGid({ type: 'Customer', id: customerId }) : undefined,
      expiresOn: shopifyValues.readIsoDate(propsValue.expires_on),
      note: shopifyValues.nonEmpty(propsValue.note),
      recipientAttributes: recipient,
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      giftCardCreate: { giftCard: GqlGiftCard | null; giftCardCode?: string | null } | null;
    }>({
      auth,
      query: `mutation CreateGiftCard($input: GiftCardCreateInput!) { giftCardCreate(input: $input) { giftCard { ${shopifyFields.GIFT_CARD_FIELDS} } giftCardCode userErrors { field message code } } }`,
      variables: { input },
    });
    const card = data.giftCardCreate?.giftCard;
    const giftCardCode = data.giftCardCreate?.giftCardCode ?? null;
    if (!card) {
      if (giftCardCode || redactedFields.includes('giftCardCreate.giftCard')) {
        throw new Error(
          `Shopify CREATED the gift card${giftCardCode ? ` (code ${giftCardCode})` : ''}, but withheld the new record because this app is not approved to read GiftCard objects (protected customer data). Do not retry: another call issues another gift card with real store value. To read gift cards, grant the app protected customer data access (Partner Dashboard > App > API access > Protected customer data).`
        );
      }
      throw new Error('Shopify did not return the new gift card.');
    }
    return {
      ...shopifyMappers.mapGiftCard(card),
      gift_card_code: giftCardCode,
      redacted_fields: redactedFields,
    };
  },
});

function buildRecipient({
  recipientCustomerId,
  preferredName,
  message,
  sendNotificationAt,
}: {
  recipientCustomerId: string | undefined;
  preferredName: string | undefined;
  message: string | undefined;
  sendNotificationAt: string | undefined;
}): Record<string, unknown> | undefined {
  const id = shopifyValues.nonEmpty(recipientCustomerId);
  const details = shopifyValues.compact({
    preferredName: shopifyValues.nonEmpty(preferredName),
    message: shopifyValues.nonEmpty(message),
    sendNotificationAt: shopifyValues.nonEmpty(sendNotificationAt),
  });
  if (!id) {
    if (Object.keys(details).length > 0) {
      throw new Error(
        'recipient_preferred_name, recipient_message and send_notification_at need recipient_customer_id. Nothing was changed.'
      );
    }
    return undefined;
  }
  return { id: shopifyGraphqlClient.toGid({ type: 'Customer', id }), ...details };
}
