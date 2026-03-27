import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { kodeProAuth, makeKodeProRequest, KodeProAuth } from "../common";

export const syncTimeline = createAction({
  auth: kodeProAuth,
  name: "sync_timeline",
  displayName: "Sync Timeline",
  description: "Sync a batch of timeline events for a contact.",
  props: {
    contact_id: Property.ShortText({
      displayName: "Contact ID",
      description: "The Kode Pro contact UUID",
      required: true,
    }),
    provider: Property.ShortText({
      displayName: "Provider",
      description: "The source provider (e.g. housecall_pro)",
      required: true,
    }),
    events: Property.Array({
      displayName: "Events",
      description: "Array of timeline event objects to sync",
      required: true,
    }),
  },

  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      contact_id: propsValue["contact_id"],
      provider: propsValue["provider"],
      events: propsValue["events"],
    };

    const response = await makeKodeProRequest(
      auth as unknown as KodeProAuth,
      "/timeline/sync",
      HttpMethod.POST,
      body
    );

    return response.body;
  },
});
