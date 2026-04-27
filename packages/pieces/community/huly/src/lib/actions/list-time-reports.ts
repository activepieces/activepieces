import { createAction } from "@activepieces/pieces-framework";
import { listTimeSpendReports } from "@hulymcp/huly/operations/time.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listTimeReportsAction = createAction({
  auth: hulyAuth,
  name: "list_time_reports",
  displayName: "List Time Reports",
  description: "List time spend reports across your Huly workspace",
  props: {},
  async run(context) {
    const reports = await withHulyClient(
      context.auth,
      listTimeSpendReports({})
    );
    return reports.map((r) => ({
      id: r.id,
      identifier: r.identifier ?? null,
      employee: r.employee ?? null,
      date: r.date ?? null,
      value: r.value,
      description: r.description ?? null,
    }));
  },
});
