import { TriggerStrategy, createTrigger } from "@activepieces/pieces-framework";
import { FacebookPageDropdown, facebookLeadsCommon } from "../common";

export const newLead = createTrigger({
    name: 'new_lead',
    displayName: 'New Lead',
    description: 'Triggers when a new lead is created',
    type: TriggerStrategy.APP_WEBHOOK,
    sampleData: {},
    props: {
        authentication: facebookLeadsCommon.authentication,
        page: facebookLeadsCommon.page,
        form: facebookLeadsCommon.form
    },

    async onEnable(context) {
        const page = context.propsValue['page'] as FacebookPageDropdown
        await facebookLeadsCommon.subscribePageToApp(page.id, page.accessToken)

        context.app.createListeners({ events: ['lead'], identifierValue: '444444444444' })
    },

    async onDisable(context) {
        //
    },

    //Return new lead
    async run(context) {
        let leads: any[] = [];
        const form = context.propsValue.form;
        
        if (form !== undefined && form !== '' && form !== null) {
            context.payload.body.entry.forEach((lead: any) => {
                if (form == lead.changes[0].value.form_id) {
                    leads.push(lead)
                }
            });
        }
        else {
            leads = context.payload.body.entry;
        }

        return [leads];
    }
})