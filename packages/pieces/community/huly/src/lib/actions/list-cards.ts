import { createAction, Property } from "@activepieces/pieces-framework";
import { listCards } from "@hulymcp/huly/operations/cards.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listCardsAction = createAction({
  auth: hulyAuth,
  name: "list_cards",
  displayName: "List Cards",
  description: "List cards in a Huly card space",
  props: {
    card_space: Property.ShortText({
      displayName: "Card Space",
      description: "Card space name or ID",
      required: true,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      listCards({ cardSpace: context.propsValue.card_space })
    );
    return result.cards.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type ?? null,
      modified_on: c.modifiedOn ?? null,
    }));
  },
});
