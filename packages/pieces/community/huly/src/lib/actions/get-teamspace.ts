import { createAction } from "@activepieces/pieces-framework";
import { getTeamspace } from "@hulymcp/huly/operations/documents.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { teamspaceDropdown } from "../common/props";

export const getTeamspaceAction = createAction({
  auth: hulyAuth,
  name: "get_teamspace",
  displayName: "Get Teamspace",
  description: "Get full details of a Huly teamspace",
  props: {
    teamspace: teamspaceDropdown,
  },
  async run(context) {
    const t = await withHulyClient(
      context.auth,
      getTeamspace({ teamspace: context.propsValue.teamspace })
    );
    return {
      id: t.id,
      name: t.name,
      description: t.description ?? null,
      archived: t.archived,
      private: t.private,
      documents: t.documents,
    };
  },
});
