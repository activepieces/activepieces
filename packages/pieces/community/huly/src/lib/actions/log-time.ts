import { createAction, Property } from "@activepieces/pieces-framework";
import { logTime } from "@hulymcp/huly/operations/time.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { projectDropdown } from "../common/props";

export const logTimeAction = createAction({
  auth: hulyAuth,
  name: "log_time",
  displayName: "Log Time",
  description: "Log time spent on an issue",
  props: {
    project: projectDropdown,
    identifier: Property.ShortText({
      displayName: "Issue Identifier",
      description: 'Issue identifier (e.g., "HULY-123")',
      required: true,
    }),
    value: Property.Number({
      displayName: "Time (minutes)",
      description: "Time spent in minutes",
      required: true,
    }),
    description: Property.ShortText({
      displayName: "Description",
      description: "Description of work done",
      required: false,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      logTime({
        project: context.propsValue.project,
        identifier: context.propsValue.identifier,
        value: context.propsValue.value,
        description: context.propsValue.description || undefined,
      })
    );
    return { report_id: result.reportId, identifier: result.identifier };
  },
});
