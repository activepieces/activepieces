import { createAction } from "@activepieces/pieces-framework";
import { listComponents } from "@hulymcp/huly/operations/components.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { projectDropdown } from "../common/props";

export const listComponentsAction = createAction({
  auth: hulyAuth,
  name: "list_components",
  displayName: "List Components",
  description: "List components in a Huly project",
  props: {
    project: projectDropdown,
  },
  async run(context) {
    const components = await withHulyClient(
      context.auth,
      listComponents({ project: context.propsValue.project })
    );
    return components.map((c) => ({
      id: c.id,
      label: c.label,
      lead: c.lead ?? null,
      modified_on: c.modifiedOn ?? null,
    }));
  },
});
