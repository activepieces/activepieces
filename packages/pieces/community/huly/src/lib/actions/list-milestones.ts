import { createAction } from "@activepieces/pieces-framework";
import { listMilestones } from "@hulymcp/huly/operations/milestones.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { projectDropdown } from "../common/props";

export const listMilestonesAction = createAction({
  auth: hulyAuth,
  name: "list_milestones",
  displayName: "List Milestones",
  description: "List milestones in a Huly project",
  props: {
    project: projectDropdown,
  },
  async run(context) {
    const milestones = await withHulyClient(
      context.auth,
      listMilestones({ project: context.propsValue.project })
    );
    return milestones.map((m) => ({
      id: m.id,
      label: m.label,
      status: m.status,
      target_date: m.targetDate,
      modified_on: m.modifiedOn ?? null,
    }));
  },
});
