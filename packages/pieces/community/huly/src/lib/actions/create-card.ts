import { createAction, Property } from "@activepieces/pieces-framework";
import { createCard } from "@hulymcp/huly/operations/cards.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const createCardAction = createAction({
  auth: hulyAuth,
  name: "create_card",
  displayName: "Create Card",
  description: "Create a new card in a Huly card space",
  props: {
    card_space: Property.ShortText({
      displayName: "Card Space",
      description: "Card space name or ID",
      required: true,
    }),
    type: Property.ShortText({
      displayName: "Card Type",
      description: "Master tag / card type name or ID",
      required: true,
    }),
    title: Property.ShortText({
      displayName: "Title",
      description: "Card title",
      required: true,
    }),
    content: Property.LongText({
      displayName: "Content",
      description: "Card content (markdown)",
      required: false,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      createCard({
        cardSpace: context.propsValue.card_space,
        type: context.propsValue.type,
        title: context.propsValue.title,
        content: context.propsValue.content || undefined,
      })
    );
    return { id: result.id, title: result.title };
  },
});
