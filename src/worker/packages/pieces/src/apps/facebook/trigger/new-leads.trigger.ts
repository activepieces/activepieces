import { createTrigger } from "../../../framework/trigger/trigger";
import { TriggerType } from "../../../framework/trigger/trigger-type";
import {PropertyType} from "../../../framework/property/prop.model";

export const newLeads= createTrigger(
    {
        name:"new_leads",
        displayName:"New Leads",
        description:"This webhook will be triggered on creation on new leads",
        onDisable:async()=>{},
        onEnable: async()=>{},
        run: async(context)=>{return Promise.resolve([])},
        props:[{
			name: 'authentication',
			description: "",
			displayName: 'Authentication',
			type: PropertyType.OAUTH2,
			authUrl: "https://www.facebook.com/v15.0/dialog/oauth",
			tokenUrl: "https://graph.facebook.com/v15.0/oauth/access_token",
			required: true,
			scope: ["pages_show_list","ads_management","ads_read","leads_retrieval","pages_read_engagement","pages_manage_metadata","pages_manage_ads"]
		},],
        type:TriggerType.WEBHOOK
    }
)