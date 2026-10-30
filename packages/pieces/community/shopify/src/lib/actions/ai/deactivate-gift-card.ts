import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlGiftCard,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { giftCardOutputSchema } from '../../output-schemas/fulfillment';

export const shopifyAiDeactivateGiftCard = createAction({
  auth: shopifyAuth,
  name: 'deactivate_gift_card',
  classification: 'DESTRUCTIVE',
  displayName: 'Deactivate Gift Card',
  description: 'Permanently disable a gift card so it can no longer be used.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deactivates one gift card and returns it with enabled=false and deactivated_at set. IRREVERSIBLE: a deactivated gift card can never be re-enabled and its remaining balance can no longer be spent. Confirm the card (get_gift_card) before calling. A repeat call does not restore anything. Needs the write_gift_cards access scope.',
    idempotent: false,
  },
  outputSchema: giftCardOutputSchema,
  props: {
    gift_card_id: Property.ShortText({
      displayName: 'Gift Card ID',
      description: 'The gift card to deactivate, numeric or "gid://shopify/GiftCard/…". Find it with search_gift_cards.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'GiftCard', id: propsValue.gift_card_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      giftCardDeactivate: { giftCard: GqlGiftCard | null } | null;
    }>({
      auth,
      query: `mutation DeactivateGiftCard($id: ID!) { giftCardDeactivate(id: $id) { giftCard { ${shopifyFields.GIFT_CARD_FIELDS} } userErrors { field message code } } }`,
      variables: { id },
    });
    const card = data.giftCardDeactivate?.giftCard;
    if (!card) {
      throw new Error('Shopify did not return the deactivated gift card.');
    }
    return {
      ...shopifyMappers.mapGiftCard(card),
      redacted_fields: redactedFields,
    };
  },
});
