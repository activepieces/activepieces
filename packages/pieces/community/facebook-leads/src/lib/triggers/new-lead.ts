import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { facebookLeadsCommon } from '../common';
import { facebookLeadsAuth } from '../auth';
import { FacebookTriggerPayloadBody, FacebookPageDropdown } from '../common/types';

export const newLead = createTrigger({
	auth: facebookLeadsAuth,
	name: 'new_lead',
	displayName: 'New Lead',
	description: 'Triggers when a new lead is created.',
	aiMetadata: {
		description:
			'Fires when a person submits a Facebook/Instagram Lead Ad form on the connected Page. Emits the new lead, including the submitted field answers (such as name, email, and phone) and form/page context. If a specific form is selected, only submissions to that form fire the trigger; otherwise any form on the Page does.',
	},
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
	async test(context) {
		let form = context.propsValue.form as string;
		const page = context.propsValue.page as FacebookPageDropdown;
		if (form == undefined || form == '' || form == null) {
			const forms = await facebookLeadsCommon.getPageForms(page.id, page.accessToken);

			form = forms[0].id;
		}

		const response = await facebookLeadsCommon.loadSampleData(form, context.auth.access_token);
		return response.data.map((lead) => facebookLeadsCommon.transformLeadData(lead));
	},

	//Return new lead
	async run(context) {
		let leadPings: any[] = [];
		const leads: any[] = [];
		const form = context.propsValue.form;
		const payloadBody = context.payload.body as FacebookTriggerPayloadBody;

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
				context.auth.access_token,
			);
			const transformLead = facebookLeadsCommon.transformLeadData(leadData);
			leads.push(transformLead);
		}

		return leads;
	},
});
