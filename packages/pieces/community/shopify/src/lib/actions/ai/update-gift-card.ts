import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlGiftCard,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';
import { giftCardOutputSchema } from '../../output-schemas/fulfillment';

export const shopifyAiUpdateGiftCard = createAction({
  auth: shopifyAuth,
  name: 'update_gift_card',
  classification: 'WRITE',
  displayName: 'Update Gift Card',
  description: 'Change a gift card\'s note, expiry date, owner or recipient.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates one gift card and returns it. Only the fields you supply are sent; at least one is required. You can change the internal note, the expiry date, the owner customer, the theme template suffix and the recipient (customer, preferred name, message, notification time). The balance and the code cannot be changed here, and a deactivated card cannot be re-enabled. Repeating the same update leaves the same state. Needs the write_gift_cards access scope.',
    idempotent: true,
  },
  outputSchema: giftCardOutputSchema,
  props: {
    gift_card_id: Property.ShortText({
      displayName: 'Gift Card ID',
      description: 'The gift card id, numeric or "gid://shopify/GiftCard/…". Find it with search_gift_cards.',
      required: true,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'New internal note. Leave empty to keep the current one.',
      required: false,
    }),
    expires_on: Property.ShortText({
      displayName: 'Expires On',
      description: 'New expiry date, YYYY-MM-DD, for example "2027-12-31". Leave empty to keep the current one.',
      required: false,
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'New owner customer, numeric or "gid://shopify/Customer/…". Leave empty to keep the current owner.',
      required: false,
    }),
    template_suffix: Property.ShortText({
      displayName: 'Template Suffix',
      description: 'Theme template suffix for the gift card page, for example "birthday". Leave empty to keep it.',
      required: false,
    }),
    recipient_customer_id: Property.ShortText({
      displayName: 'Recipient Customer ID',
      description:
        'Customer who receives the gift card notification, numeric or "gid://shopify/Customer/…". Required to change any recipient detail.',
      required: false,
    }),
    recipient_preferred_name: Property.ShortText({
      displayName: 'Recipient Preferred Name',
      description: 'Name used to greet the recipient, for example "Sam".',
      required: false,
    }),
    recipient_message: Property.LongText({
      displayName: 'Recipient Message',
      description: 'Personal message included in the recipient notification.',
      required: false,
    }),
    send_notification_at: Property.DateTime({
      displayName: 'Send Notification At',
      description: 'Time to email the recipient, ISO 8601.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'GiftCard', id: propsValue.gift_card_id });
    const customerId = shopifyValues.nonEmpty(propsValue.customer_id);
    const recipientId = shopifyValues.nonEmpty(propsValue.recipient_customer_id);
    const recipientDetails = shopifyValues.compact({
      preferredName: shopifyValues.nonEmpty(propsValue.recipient_preferred_name),
      message: shopifyValues.nonEmpty(propsValue.recipient_message),
      sendNotificationAt: shopifyValues.nonEmpty(propsValue.send_notification_at),
    });
    if (!recipientId && Object.keys(recipientDetails).length > 0) {
      throw new Error(
        'Recipient details need recipient_customer_id (the recipient is replaced as a whole). Nothing was changed.'
      );
    }
    const input = shopifyValues.compact({
      note: shopifyValues.nonEmpty(propsValue.note),
      expiresOn: shopifyValues.readIsoDate(propsValue.expires_on),
      customerId: customerId ? shopifyGraphqlClient.toGid({ type: 'Customer', id: customerId }) : undefined,
      templateSuffix: shopifyValues.nonEmpty(propsValue.template_suffix),
      recipientAttributes: recipientId
        ? { id: shopifyGraphqlClient.toGid({ type: 'Customer', id: recipientId }), ...recipientDetails }
        : undefined,
    });
    if (Object.keys(input).length === 0) {
      throw new Error('Nothing to update: provide at least one field to change. Nothing was changed.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      giftCardUpdate: { giftCard: GqlGiftCard | null } | null;
    }>({
      auth,
      query: `mutation UpdateGiftCard($id: ID!, $input: GiftCardUpdateInput!) { giftCardUpdate(id: $id, input: $input) { giftCard { ${shopifyFields.GIFT_CARD_FIELDS} } userErrors { field message } } }`,
      variables: { id, input },
    });
    const card = data.giftCardUpdate?.giftCard;
    if (!card) {
      throw new Error('Shopify did not return the updated gift card.');
    }
    return {
      ...shopifyMappers.mapGiftCard(card),
      redacted_fields: redactedFields,
    };
  },
});
