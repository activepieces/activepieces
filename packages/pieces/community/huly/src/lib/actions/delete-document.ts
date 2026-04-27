import { createAction, Property } from "@activepieces/pieces-framework";
import { deleteDocument } from "@hulymcp/huly/operations/documents.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { teamspaceDropdown } from "../common/props";

export const deleteDocumentAction = createAction({
  auth: hulyAuth,
  name: "delete_document",
  displayName: "Delete Document",
  description: "Delete a document from a Huly teamspace",
  props: {
    teamspace: teamspaceDropdown,
    document: Property.ShortText({
      displayName: "Document Title",
      description: "Title of the document to delete",
      required: true,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      deleteDocument({
        teamspace: context.propsValue.teamspace,
        document: context.propsValue.document,
      })
    );
    return {
      id: result.id,
      deleted: result.deleted,
    };
  },
});
