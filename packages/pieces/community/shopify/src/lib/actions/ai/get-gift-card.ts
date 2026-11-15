import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlGiftCard,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { giftCardOutputSchema } from '../../output-schemas/fulfillment';

export const shopifyAiGetGiftCard = createAction({
  auth: shopifyAuth,
  name: 'get_gift_card',
  classification: 'READ',
  displayName: 'Get Gift Card',
  description: 'Get one gift card with its balance, status and owner.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one gift card: balance and initial value with currency, whether it is enabled and redeemable, expiry, deactivation time, owner customer, originating order, recipient details and note. Only the last characters of the code are ever returned (masked_code, last_characters); the full code is shown once, by create_gift_card. Needs the read_gift_cards access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: giftCardOutputSchema,
  props: {
    gift_card_id: Property.ShortText({
      displayName: 'Gift Card ID',
      description: 'The gift card id, numeric or "gid://shopify/GiftCard/…". Find it with search_gift_cards.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'GiftCard', id: propsValue.gift_card_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      giftCard: GqlGiftCard | null;
    }>({
      auth,
      query: `query GetGiftCard($id: ID!) { giftCard(id: $id) { ${shopifyFields.GIFT_CARD_FIELDS} } }`,
      variables: { id },
    });
    if (!data.giftCard) {
      throw new Error(`Gift card ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapGiftCard(data.giftCard),
      redacted_fields: redactedFields,
    };
  },
});
