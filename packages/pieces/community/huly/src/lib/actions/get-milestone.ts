import { createAction, Property } from "@activepieces/pieces-framework";
import { getMilestone } from "@hulymcp/huly/operations/milestones.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { projectDropdown, milestoneDropdown } from "../common/props";

export const getMilestoneAction = createAction({
  auth: hulyAuth,
  name: "get_milestone",
  displayName: "Get Milestone",
  description: "Get full details of a Huly milestone",
  props: {
    project: projectDropdown,
    milestone: milestoneDropdown,
  },
  async run(context) {
    const m = await withHulyClient(
      context.auth,
      getMilestone({
        project: context.propsValue.project,
        milestone: context.propsValue.milestone ?? "",
      })
    );
    return {
      id: m.id,
      label: m.label,
      description: m.description ?? null,
      status: m.status,
      target_date: m.targetDate,
      project: m.project,
      modified_on: m.modifiedOn ?? null,
      created_on: m.createdOn ?? null,
    };
  },
});
