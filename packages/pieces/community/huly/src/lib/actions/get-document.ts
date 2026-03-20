import { createAction, Property } from "@activepieces/pieces-framework";
import { getDocument } from "@hulymcp/huly/operations/documents.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { teamspaceDropdown } from "../common/props";

export const getDocumentAction = createAction({
  auth: hulyAuth,
  name: "get_document",
  displayName: "Get Document",
  description: "Get a document with its markdown content from a Huly teamspace",
  props: {
    teamspace: teamspaceDropdown,
    document: Property.ShortText({
      displayName: "Document Title",
      description: "Title of the document to retrieve",
      required: true,
    }),
  },
  async run(context) {
    const d = await withHulyClient(
      context.auth,
      getDocument({
        teamspace: context.propsValue.teamspace,
        document: context.propsValue.document,
      })
    );
    return {
      id: d.id,
      title: d.title,
      content: d.content ?? null,
      teamspace: d.teamspace,
      modified_on: d.modifiedOn ?? null,
      created_on: d.createdOn ?? null,
    };
  },
});
