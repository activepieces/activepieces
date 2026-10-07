import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';

import { facebookLeadsAuth } from '../auth';
import { facebookLeadsApi } from '../common/api';
import { facebookLeadsProps } from '../common/props';

import type { FacebookLeadsLead, FacebookLeadsWebhookPayload } from '../common/types';

export const newLeadTrigger = createTrigger({
	auth: facebookLeadsAuth,
	name: 'new_lead',
	classification: 'READ',
	displayName: 'New Lead',
	description: 'Triggers when a new lead is created.',
	aiMetadata: {
		description:
			'Fires when a person submits a Facebook/Instagram Lead Ad form on the connected Page. Emits the new lead, including the submitted field answers (such as name, email, and phone) and form/page context. If a specific form is selected, only submissions to that form fire the trigger; otherwise any form on the Page does.',
	},
	type: TriggerStrategy.APP_WEBHOOK,
	sampleData: {},
	props: {
		page: facebookLeadsProps.page({ required: true }),
		form: facebookLeadsProps.form({ required: false }),
	},

	async onEnable(context) {
		const page = context.propsValue.page;
		await facebookLeadsApi.subscribePageToApp({
			pageId: page.id,
			accessToken: page.accessToken,
		});

		context.app.createListeners({ events: ['lead'], identifierValue: page.id });
	},

	async onDisable() {
		return;
	},
	async test(context) {
		let form = context.propsValue.form;
		const page = context.propsValue.page;
		if (form == undefined || form == '' || form == null) {
			const forms = await facebookLeadsApi.getPageForms({
				pageId: page.id,
				accessToken: page.accessToken,
			});

			form = forms[0].id;
		}

		const leads = await facebookLeadsApi.listFormLeads({
			formId: form,
			accessToken: context.auth.access_token,
		});
		return leads.map((lead) => transformLeadData({ lead }));
	},

	async run(context) {
		const form = context.propsValue.form;
		const payloadBody = context.payload.body;
		const entries = isWebhookPayload(payloadBody) ? payloadBody.entry : [];

		const leadPings =
			form !== undefined && form !== '' && form !== null
				? entries.filter((lead) => form == lead.changes[0].value.form_id)
				: entries;

		const leads = [];
		for (const lead of leadPings) {
			const leadData = await facebookLeadsApi.getLead({
				leadId: lead.changes[0].value.leadgen_id,
				accessToken: context.auth.access_token,
			});
			leads.push(transformLeadData({ lead: leadData }));
		}

		return leads;
	},
});

function isWebhookPayload(body: unknown): body is FacebookLeadsWebhookPayload {
	return typeof body === 'object' && body !== null && 'entry' in body && Array.isArray(body.entry);
}

function transformLeadData({ lead }: { lead: FacebookLeadsLead }) {
	return {
		lead_id: lead.id,
		form_id: lead.form_id,
		platform: lead.platform,
		ad_id: lead.ad_id,
		ad_name: lead.ad_name,
		adset_id: lead.adset_id,
		adset_name: lead.adset_name,
		campaign_id: lead.campaign_id,
		campaign_name: lead.campaign_name,
		created_time: lead.created_time,
		data: lead.field_data.reduce(
			(acc, field) => ({
				...acc,
				[field.name]: field.values && field.values.length > 0 ? field.values[0] : null,
			}),
			{},
		),
	};
}
