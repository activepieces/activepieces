import { TriggerStrategy, createTrigger } from "@activepieces/pieces-framework";
import { FacebookPageDropdown, facebookLeadsCommon } from "../common";
import { facebookLeadsAuth } from "../..";

export const newLead = createTrigger({
    auth: facebookLeadsAuth,
        name: 'new_lead',
        displayName: 'New Lead',
        description: 'Triggers when a new lead is created',
        type: TriggerStrategy.APP_WEBHOOK,
        sampleData: {},
        props: {
            page: facebookLeadsCommon.page,
            form: facebookLeadsCommon.form
        },

        async onEnable(context) {
            const page = context.propsValue['page'] as FacebookPageDropdown
            await facebookLeadsCommon.subscribePageToApp(page.id, page.accessToken)

            context.app.createListeners({ events: ['lead'], identifierValue: page.id })
        },

        async onDisable() {
            //
        },

        //Return new lead
        async run(context) {
            let leadPings: any[] = [];
            const leads: any[] = [];
            const form = context.propsValue.form;

            if (form !== undefined && form !== '' && form !== null) {
                context.payload.body.entry.forEach((lead: any) => {
                    if (form == lead.changes[0].value.form_id) {
                        leadPings.push(lead)
                    }
                });
            }
            else {
                leadPings = context.payload.body.entry;
            }

            leadPings.forEach(async (lead) => {
                const leadData = await facebookLeadsCommon.getLeadDetails(lead.changes[0].value.leadgen_id, context.auth.access_token);
                leads.push(leadData);
            })

            return [leads];
        },
})
