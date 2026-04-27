import { createAction } from "@activepieces/pieces-framework";
import { listDocuments } from "@hulymcp/huly/operations/documents.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { teamspaceDropdown } from "../common/props";

export const listDocumentsAction = createAction({
  auth: hulyAuth,
  name: "list_documents",
  displayName: "List Documents",
  description: "List documents in a Huly teamspace",
  props: {
    teamspace: teamspaceDropdown,
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      listDocuments({ teamspace: context.propsValue.teamspace })
    );
    return result.documents.map((d) => ({
      id: d.id,
      title: d.title,
      teamspace: d.teamspace,
      modified_on: d.modifiedOn ?? null,
    }));
  },
});
