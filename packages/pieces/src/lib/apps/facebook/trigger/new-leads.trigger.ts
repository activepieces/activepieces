import {createTrigger, TriggerStrategy} from "../../../framework/trigger/trigger";
import {Property} from "../../../framework/property";

export const newLeads = createTrigger(
    {
        name: "new_leads",
        displayName: "New Leads",
        description: "This webhook will be triggered on creation on new leads",
        type: TriggerStrategy.WEBHOOK,
        props: {
          /**   authentication: Property.OAuth2({
                description: "",
                displayName: 'Authentication',
                authUrl: "https://www.facebook.com/v15.0/dialog/oauth",
                tokenUrl: "https://graph.facebook.com/v15.0/oauth/access_token",
                required: true,
                scope: ["pages_show_list", "ads_management", "ads_read", "leads_retrieval", "pages_read_engagement", "pages_manage_metadata", "pages_manage_ads"]
            })**/
        },
        onDisable: async (context) => {
            context.store?.save("hello", "Magorium");
            console.log(await context.store?.get("hello"));
        },
        onEnable: async (context) => {
        },
        run: async (context) => {
            return Promise.resolve([])
        }}
)