import { createAction, Property } from "@activepieces/pieces-framework";
import { createLabel } from "@hulymcp/huly/operations/labels.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const createLabelAction = createAction({
  auth: hulyAuth,
  name: "create_label",
  displayName: "Create Label",
  description: "Create a new label in your Huly workspace",
  props: {
    title: Property.ShortText({
      displayName: "Label Name",
      description: "Name for the label",
      required: true,
    }),
    color: Property.StaticDropdown<number, false>({
      displayName: "Color",
      description: "Label color (0-9)",
      required: false,
      options: {
        options: Array.from({ length: 10 }, (_, i) => ({
          label: `Color ${i}`,
          value: i,
        })),
      },
    }),
    description: Property.LongText({
      displayName: "Description",
      description: "Label description",
      required: false,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      createLabel({
        title: context.propsValue.title,
        color: context.propsValue.color || undefined,
        description: context.propsValue.description || undefined,
      })
    );
    return {
      id: result.id,
      title: result.title,
      created: result.created,
    };
  },
});
