import { createAction, Property } from "@activepieces/pieces-framework";
import { deleteLabel } from "@hulymcp/huly/operations/labels.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const deleteLabelAction = createAction({
  auth: hulyAuth,
  name: "delete_label",
  displayName: "Delete Label",
  description: "Delete a label from your Huly workspace",
  props: {
    label: Property.ShortText({
      displayName: "Label Name",
      description: "Name of the label to delete",
      required: true,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      deleteLabel({ label: context.propsValue.label })
    );
    return {
      id: result.id,
      deleted: result.deleted,
    };
  },
});
