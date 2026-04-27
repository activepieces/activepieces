import { createAction } from "@activepieces/pieces-framework";
import { listCardSpaces } from "@hulymcp/huly/operations/cards.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listCardSpacesAction = createAction({
  auth: hulyAuth,
  name: "list_card_spaces",
  displayName: "List Card Spaces",
  description: "List card spaces in your Huly workspace",
  props: {},
  async run(context) {
    const result = await withHulyClient(context.auth, listCardSpaces({}));
    return result.cardSpaces.map((cs) => ({
      id: cs.id,
      name: cs.name,
      description: cs.description ?? null,
      archived: cs.archived,
    }));
  },
});
