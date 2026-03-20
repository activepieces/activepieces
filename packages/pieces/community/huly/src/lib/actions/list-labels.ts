import { createAction } from "@activepieces/pieces-framework";
import { listLabels } from "@hulymcp/huly/operations/labels.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listLabelsAction = createAction({
  auth: hulyAuth,
  name: "list_labels",
  displayName: "List Labels",
  description: "List all labels in your Huly workspace",
  props: {},
  async run(context) {
    const labels = await withHulyClient(context.auth, listLabels({}));
    return labels.map((l) => ({
      id: l.id,
      title: l.title,
      color: l.color,
      category: l.category,
    }));
  },
});
