import { createAction } from "@activepieces/pieces-framework";
import { listTeamspaces } from "@hulymcp/huly/operations/documents.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listTeamspacesAction = createAction({
  auth: hulyAuth,
  name: "list_teamspaces",
  displayName: "List Teamspaces",
  description: "List all teamspaces in your Huly workspace",
  props: {},
  async run(context) {
    const result = await withHulyClient(context.auth, listTeamspaces({}));
    return result.teamspaces.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description ?? null,
      archived: t.archived,
      private: t.private,
    }));
  },
});
