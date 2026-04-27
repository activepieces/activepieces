import { createAction, Property } from "@activepieces/pieces-framework";
import { editDocument } from "@hulymcp/huly/operations/documents-edit.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { teamspaceDropdown } from "../common/props";

export const editDocumentAction = createAction({
  auth: hulyAuth,
  name: "edit_document",
  displayName: "Edit Document",
  description:
    "Edit a document — update title, replace content, or search-and-replace text",
  props: {
    teamspace: teamspaceDropdown,
    document: Property.ShortText({
      displayName: "Document Title",
      description: "Title of the document to edit",
      required: true,
    }),
    title: Property.ShortText({
      displayName: "New Title",
      description: "New document title (leave empty to keep current)",
      required: false,
    }),
    content: Property.LongText({
      displayName: "New Content",
      description:
        "Replace entire content with this markdown (leave empty to keep current)",
      required: false,
    }),
    old_text: Property.LongText({
      displayName: "Search Text",
      description: "Text to find in the document (for search-and-replace)",
      required: false,
    }),
    new_text: Property.LongText({
      displayName: "Replace With",
      description: "Text to replace the search text with",
      required: false,
    }),
    replace_all: Property.Checkbox({
      displayName: "Replace All",
      description: "Replace all occurrences (default: first only)",
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      editDocument({
        teamspace: context.propsValue.teamspace,
        document: context.propsValue.document,
        title: context.propsValue.title || undefined,
        content: context.propsValue.content || undefined,
        old_text: context.propsValue.old_text || undefined,
        new_text: context.propsValue.new_text || undefined,
        replace_all: context.propsValue.replace_all || undefined,
      })
    );
    return {
      id: result.id,
      updated: result.updated,
    };
  },
});
