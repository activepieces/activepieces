import { createAction, Property } from "@activepieces/pieces-framework";
import { createComponent } from "@hulymcp/huly/operations/components.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { projectDropdown } from "../common/props";

export const createComponentAction = createAction({
  auth: hulyAuth,
  name: "create_component",
  displayName: "Create Component",
  description: "Create a new component in a Huly project",
  props: {
    project: projectDropdown,
    label: Property.ShortText({
      displayName: "Component Name",
      description: "Name for the component",
      required: true,
    }),
    description: Property.LongText({
      displayName: "Description",
      description: "Component description",
      required: false,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      createComponent({
        project: context.propsValue.project,
        label: context.propsValue.label,
        description: context.propsValue.description || undefined,
      })
    );
    return {
      id: result.id,
      label: result.label,
    };
  },
});
