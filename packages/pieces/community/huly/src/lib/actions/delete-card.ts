import { createAction, Property } from "@activepieces/pieces-framework";
import { deleteCard } from "@hulymcp/huly/operations/cards.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const deleteCardAction = createAction({
  auth: hulyAuth,
  name: "delete_card",
  displayName: "Delete Card",
  description: "Delete a card from a Huly card space",
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
    const result = await withHulyClient(
      context.auth,
      deleteCard({
        cardSpace: context.propsValue.card_space,
        card: context.propsValue.card,
      })
    );
    return { id: result.id, deleted: result.deleted };
  },
});
