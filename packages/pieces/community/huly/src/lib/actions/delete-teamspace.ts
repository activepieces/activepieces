import { createAction } from "@activepieces/pieces-framework";
import { deleteTeamspace } from "@hulymcp/huly/operations/documents.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { teamspaceDropdown } from "../common/props";

export const deleteTeamspaceAction = createAction({
  auth: hulyAuth,
  name: "delete_teamspace",
  displayName: "Delete Teamspace",
  description: "Delete a teamspace from your Huly workspace",
  props: {
    teamspace: teamspaceDropdown,
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      deleteTeamspace({ teamspace: context.propsValue.teamspace })
    );
    return {
      id: result.id,
      deleted: result.deleted,
    };
  },
});
