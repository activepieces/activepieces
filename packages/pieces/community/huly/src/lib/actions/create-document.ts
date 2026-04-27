import { createAction, Property } from "@activepieces/pieces-framework";
import { createDocument } from "@hulymcp/huly/operations/documents.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { teamspaceDropdown } from "../common/props";

export const createDocumentAction = createAction({
  auth: hulyAuth,
  name: "create_document",
  displayName: "Create Document",
  description: "Create a new document in a Huly teamspace",
  props: {
    teamspace: teamspaceDropdown,
    title: Property.ShortText({
      displayName: "Title",
      description: "Document title",
      required: true,
    }),
    content: Property.LongText({
      displayName: "Content",
      description: "Document content in markdown",
      required: false,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      createDocument({
        teamspace: context.propsValue.teamspace,
        title: context.propsValue.title,
        content: context.propsValue.content || undefined,
      })
    );
    return {
      id: result.id,
      title: result.title,
    };
  },
});
