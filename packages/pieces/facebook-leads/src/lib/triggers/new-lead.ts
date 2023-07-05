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

        context.app.createListeners({ events: ['lead'], identifierValue: page.id })
    },

    async onDisable(context) {
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
            const leadData = await facebookLeadsCommon.getLeadDetails(lead.changes[0].value.leadgen_id, context.propsValue.authentication.access_token);
            leads.push(leadData);
        })

        return [leads];
    },

    async test(context) {
        let form = context.propsValue.form as string;
        const page = context.propsValue.page as FacebookPageDropdown;
        if (form == undefined || form == '' || form == null) {
            const forms = await facebookLeadsCommon.getPageForms(page.id, page.accessToken);

            form = forms[0].id;
        }

        const data = await facebookLeadsCommon.loadSampleData(form, context.propsValue.authentication.access_token)
        return [data.data]
    }
})
