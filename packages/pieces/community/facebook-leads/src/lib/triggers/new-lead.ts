import { MarkdownVariant, Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';

import { facebookLeadsAuth } from '../auth';
import { facebookLeadsApi } from '../common/api';
import { facebookLeadsProps } from '../common/props';
import { facebookLeadsUtils } from '../common/utils';
import { facebookLeadsGetLeadOutputSchema } from '../output-schemas';

import type { FacebookLeadsWebhookPayload } from '../common/types';

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
	sampleData: {},
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
		let form = selectedFormId({ form: context.propsValue.form });
		const page = context.propsValue.page;
		if (form === undefined) {
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

function selectedFormId({ form }: { form: string | undefined }): string | undefined {
	if (form === undefined || form === null || form === '' || form === ALL_FORMS) {
		return undefined;
	}
	return form;
}

const ALL_FORMS = 'all';
