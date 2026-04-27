import { createAction } from "@activepieces/pieces-framework";
import { listEmployees } from "@hulymcp/huly/operations/contacts.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listEmployeesAction = createAction({
  auth: hulyAuth,
  name: "list_employees",
  displayName: "List Employees",
  description: "List employees in your Huly workspace",
  props: {},
  async run(context) {
    const employees = await withHulyClient(
      context.auth,
      listEmployees({ limit: 200 })
    );
    return employees.map((e) => ({
      id: e.id,
      name: e.name,
      email: e.email ?? null,
      position: e.position ?? null,
      active: e.active,
      modified_on: e.modifiedOn ?? null,
    }));
  },
});
