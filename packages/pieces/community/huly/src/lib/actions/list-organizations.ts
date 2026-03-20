import { createAction } from "@activepieces/pieces-framework";
import { listOrganizations } from "@hulymcp/huly/operations/contacts.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listOrganizationsAction = createAction({
  auth: hulyAuth,
  name: "list_organizations",
  displayName: "List Organizations",
  description: "List organizations in your Huly workspace",
  props: {},
  async run(context) {
    const orgs = await withHulyClient(
      context.auth,
      listOrganizations({})
    );
    return orgs.map((o) => ({
      id: o.id,
      name: o.name,
      city: o.city ?? null,
      members: o.members,
      modified_on: o.modifiedOn ?? null,
    }));
  },
});
