import { createTrigger, TriggerStrategy } from "../../../framework/trigger/trigger";
import { facebookCommon } from "../common";

export const newLeads = createTrigger(
    {
        name: "new_leads",
        displayName: "New Leads",
        description: "Runs every 15 min to fetch new leads",
        type: TriggerStrategy.POLLING,
        props: {
            authentication: facebookCommon.authentication,
            page: facebookCommon.page
        },
        onDisable: async (context) => {
        },
        onEnable: async (context) => {
            const timestamp = Math.floor(Date.now() / 1000);
            context.store?.save("lastFetched", timestamp);
        },
        run: async (context) => {
            return Promise.resolve([])
        }
    }
)