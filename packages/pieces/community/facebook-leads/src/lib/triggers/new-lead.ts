import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { FacebookPageDropdown, facebookLeadsCommon } from '../common';
import { facebookLeadsAuth } from '../..';

export const newLead = createTrigger({
  auth: facebookLeadsAuth,
  name: 'new_lead',
  displayName: 'New Lead',
  description: 'Triggers when a new lead is created',
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {},
  props: {
    page: facebookLeadsCommon.page,
    form: facebookLeadsCommon.form,
  },

  async onEnable(context) {
    const page = context.propsValue['page'] as FacebookPageDropdown;
    await facebookLeadsCommon.subscribePageToApp(page.id, page.accessToken);

    context.app.createListeners({ events: ['lead'], identifierValue: page.id });
  },

  async onDisable() {
    //
  },

  //Return new lead
  async run(context) {
    let leadPings: any[] = [];
    const leads: any[] = [];
    const form = context.propsValue.form;
    const payloadBody = context.payload.body as PayloadBody;

    if (form !== undefined && form !== '' && form !== null) {
      for (const lead of payloadBody.entry) {
        if (form == lead.changes[0].value.form_id) {
          leadPings.push(lead);
        }
      }
    } else {
      leadPings = payloadBody.entry;
    }

    for (const lead of leadPings) {
      const leadData = await facebookLeadsCommon.getLeadDetails(
        lead.changes[0].value.leadgen_id,
        context.auth.access_token
      );
      leads.push(leadData);
    }

    return [leads];
  },
  async test(context) {
    let form = context.propsValue.form as string;
    const page = context.propsValue.page as FacebookPageDropdown;
    if (form == undefined || form == '' || form == null) {
      const forms = await facebookLeadsCommon.getPageForms(
        page.id,
        page.accessToken
      );

      form = forms[0].id;
    }

    const data = await facebookLeadsCommon.loadSampleData(
      form,
      context.auth.access_token
    );
    return [data.data];
  },
});

type PayloadBody = {
  entry: {
    changes: {
      value: {
        form_id: string;
        leadgen_id: string;
      };
    }[];
  }[];
};
