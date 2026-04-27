/**
 * New Document trigger — fires when a new document is created in a teamspace.
 */
import {
  createTrigger,
  TriggerStrategy,
} from "@activepieces/pieces-framework";
import { DedupeStrategy, pollingHelper } from "@activepieces/pieces-common";
import type { Polling } from "@activepieces/pieces-common";
import { listDocuments } from "@hulymcp/huly/operations/documents.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { teamspaceDropdown } from "../common/props";

const polling: Polling<
  { url: string; email: string; password: string; workspace: string },
  { teamspace: string }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  async items({ auth, propsValue }) {
    const result = await withHulyClient(
      auth,
      listDocuments({ teamspace: propsValue.teamspace, limit: 50 })
    );
    return result.documents.map((d) => ({
      id: d.id,
      data: {
        id: d.id,
        title: d.title,
        teamspace: d.teamspace,
        modified_on: d.modifiedOn ?? null,
      },
    }));
  },
};

export const newDocumentTrigger = createTrigger({
  auth: hulyAuth,
  name: "new_document",
  displayName: "New Document",
  description: "Triggers when a new document is created in a Huly teamspace",
  type: TriggerStrategy.POLLING,
  props: {
    teamspace: teamspaceDropdown,
  },
  sampleData: {
    id: "doc-abc123",
    title: "Meeting Notes",
    teamspace: "Engineering",
    modified_on: 1710947000000,
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
