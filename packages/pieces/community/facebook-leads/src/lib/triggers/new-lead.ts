import { MarkdownVariant, Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';

import { facebookLeadsAuth } from '../auth';
import { facebookLeadsApi } from '../common/api';
import { facebookLeadsProps } from '../common/props';
import { facebookLeadsUtils } from '../common/utils';
import { facebookLeadsGetLeadOutputSchema } from '../output-schemas';

import type { FacebookLeadsLead, FacebookLeadsWebhookPayload } from '../common/types';

export const newLeadTrigger = createTrigger({
	auth: facebookLeadsAuth,
	name: 'new_lead',
	outputSchema: facebookLeadsGetLeadOutputSchema,
	classification: 'READ',
	displayName: 'New Lead',
	description: 'Triggers when someone fills in one of your lead ad forms.',
	aiMetadata: {
		description:
			'Fires when a person submits a Facebook/Instagram Lead Ad form on the connected Page. Emits the new lead, including the submitted field answers (such as name, email, and phone) and form/page context. If a specific form is selected, only submissions to that form fire the trigger; otherwise any form on the Page does.',
	},
	type: TriggerStrategy.APP_WEBHOOK,
	sampleData: {
		lead_id: '1234567890123456',
		form_id: '2345678901234567',
		platform: 'fb',
		ad_id: '3456789012345678',
		ad_name: 'Spring Promo Ad',
		adset_id: '4567890123456789',
		adset_name: 'Spring Promo Audience',
		campaign_id: '5678901234567890',
		campaign_name: 'Spring Promo Campaign',
		created_time: '2026-01-15T10:30:00+0000',
		data: {
			full_name: 'Jane Doe',
			email: 'jane.doe@example.com',
			phone_number: '+15555550100',
		},
	},
	props: {
		page: facebookLeadsProps.page({
			required: true,
			description: 'The Facebook Page that runs your lead ads.',
		}),
		form: facebookLeadsProps.form({
			required: false,
			description: 'Pick one form, or All Forms for leads from every form on the Page.',
		}),
		info: Property.MarkDown({
			value: 'Runs once for each new lead. Test Trigger loads recent leads from the chosen form, or from the first form on the Page that has any.',
			variant: MarkdownVariant.INFO,
		}),
	},
	propertyGroups: [
		{
			key: 'source',
			display: 'section',
			label: 'Watch',
			icon: 'inbox',
			props: ['page', 'form', 'info'],
		},
	],

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
		const form = selectedFormId({ form: context.propsValue.form });
		const page = context.propsValue.page;
		const accessToken = context.auth.access_token;
		const leads =
			form !== undefined
				? await facebookLeadsApi.listFormLeads({ formId: form, accessToken })
				: await firstFormLeads({ pageId: page.id, pageAccessToken: page.accessToken, accessToken });
		return leads.map((lead) => facebookLeadsUtils.transformLeadData({ lead }));
	},

	async run(context) {
		const form = selectedFormId({ form: context.propsValue.form });
		const payloadBody = context.payload.body;
		const entries = isWebhookPayload(payloadBody) ? payloadBody.entry : [];

		const leadPings =
			form !== undefined
				? entries.filter((lead) => form == lead.changes[0].value.form_id)
				: entries;

		const leads = [];
		for (const lead of leadPings) {
			const leadData = await facebookLeadsApi.getLead({
				leadId: lead.changes[0].value.leadgen_id,
				accessToken: context.auth.access_token,
			});
			leads.push(facebookLeadsUtils.transformLeadData({ lead: leadData }));
		}

		return leads;
	},
});

function isWebhookPayload(body: unknown): body is FacebookLeadsWebhookPayload {
	return typeof body === 'object' && body !== null && 'entry' in body && Array.isArray(body.entry);
}

async function firstFormLeads({
	pageId,
	pageAccessToken,
	accessToken,
}: {
	pageId: string;
	pageAccessToken: string;
	accessToken: string;
}): Promise<FacebookLeadsLead[]> {
	const forms = await facebookLeadsApi.listLeadForms({
		pageId,
		accessToken: pageAccessToken,
		detailed: true,
	});
	const formsWithLeads = forms.filter((form) => form.leads_count === undefined || form.leads_count > 0);
	for (const form of formsWithLeads) {
		const leads = await facebookLeadsApi.listFormLeads({ formId: form.id, accessToken });
		if (leads.length > 0) {
			return leads;
		}
	}
	return [];
}

function selectedFormId({ form }: { form: string | undefined }): string | undefined {
	if (form === undefined || form === null || form === '' || form === ALL_FORMS) {
		return undefined;
	}
	return form;
}

const ALL_FORMS = 'all';
