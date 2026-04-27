import { createAction, Property } from "@activepieces/pieces-framework";
import { getCard } from "@hulymcp/huly/operations/cards.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const getCardAction = createAction({
  auth: hulyAuth,
  name: "get_card",
  displayName: "Get Card",
  description: "Get full details of a card",
  props: {
    card_space: Property.ShortText({
      displayName: "Card Space",
      description: "Card space name or ID",
      required: true,
    }),
    card: Property.ShortText({
      displayName: "Card",
      description: "Card title or ID",
      required: true,
    }),
  },
  async run(context) {
    const c = await withHulyClient(
      context.auth,
      getCard({
        cardSpace: context.propsValue.card_space,
        card: context.propsValue.card,
      })
    );
    return {
      id: c.id,
      title: c.title,
      content: c.content ?? null,
      type: c.type,
      card_space: c.cardSpace,
      parent: c.parent ?? null,
      modified_on: c.modifiedOn ?? null,
      created_on: c.createdOn ?? null,
    };
  },
});
