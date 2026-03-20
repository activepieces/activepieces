import { createAction, Property } from "@activepieces/pieces-framework";
import { createMilestone } from "@hulymcp/huly/operations/milestones.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { projectDropdown } from "../common/props";

export const createMilestoneAction = createAction({
  auth: hulyAuth,
  name: "create_milestone",
  displayName: "Create Milestone",
  description: "Create a new milestone in a Huly project",
  props: {
    project: projectDropdown,
    label: Property.ShortText({
      displayName: "Milestone Name",
      description: "Name for the milestone",
      required: true,
    }),
    description: Property.LongText({
      displayName: "Description",
      description: "Milestone description",
      required: false,
    }),
    target_date: Property.DateTime({
      displayName: "Target Date",
      description: "Target completion date",
      required: true,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      createMilestone({
        project: context.propsValue.project,
        label: context.propsValue.label,
        description: context.propsValue.description || undefined,
        targetDate: new Date(context.propsValue.target_date).getTime(),
      })
    );
    return {
      id: result.id,
      label: result.label,
    };
  },
});
