import { createAction, Property } from "@activepieces/pieces-framework";
import { getComponent } from "@hulymcp/huly/operations/components.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { componentDropdown, projectDropdown } from "../common/props";

export const getComponentAction = createAction({
  auth: hulyAuth,
  name: "get_component",
  displayName: "Get Component",
  description: "Get full details of a Huly component",
  props: {
    project: projectDropdown,
    component: componentDropdown,
  },
  async run(context) {
    const c = await withHulyClient(
      context.auth,
      getComponent({
        project: context.propsValue.project,
        component: context.propsValue.component ?? "",
      })
    );
    return {
      id: c.id,
      label: c.label,
      description: c.description ?? null,
      lead: c.lead ?? null,
      project: c.project,
      modified_on: c.modifiedOn ?? null,
      created_on: c.createdOn ?? null,
    };
  },
});
