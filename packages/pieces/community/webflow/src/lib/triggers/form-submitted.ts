import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { webflowAuth } from '../auth';
import { webflowClient } from '../common/client';
import { webflowProps } from '../common/props';
import type { WebflowWebhook } from '../common/types';

const triggerNameInStore = 'webflow_created_form_submissions_trigger';

export const formSubmittedTrigger = createTrigger({
	auth: webflowAuth,
	name: 'new_submission',
	classification: 'READ',
	displayName: 'New Submission',
	description: 'Triggers when Webflow Site receives a new submission',
	aiMetadata: {
		description: 'Fires when a form on the selected Webflow site receives a new submission, delivering the submitted form data. Optionally scoped to a single form by name; if no form name is given, it fires for submissions from any form on the site.',
	},
	props: {
		site_id: webflowProps.siteId({ required: true }),
		formName: Property.ShortText({
			displayName: 'Form Name',
			required: false,
			description: 'Copy from the form settings, or from one of the responses',
		}),
	},
	type: TriggerStrategy.WEBHOOK,
	sampleData: {
		name: 'Sample Form',
		site: '62749158efef318abc8d5a0f',
		data: {
			field_one: 'mock valued',
		},
		d: '2022-09-14T12:35:16.117Z',
		_id: '6321ca84df3949bfc6752327',
	},
	async onEnable(context) {
		const webhook = await webflowClient.request<WebflowWebhook>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/sites/${context.propsValue.site_id}/webhooks`,
			headers: { 'Content-Type': 'application/json' },
			query: {},
			body: {
				triggerType: 'form_submission',
				url: context.webhookUrl,
			},
		});
		await context.store?.put<WebhookInformation>(triggerNameInStore, {
			webhookId: webhook._id,
		});
	},
	async onDisable(context) {
		const response = await context.store?.get<WebhookInformation>(triggerNameInStore);
		if (response !== null && response !== undefined) {
			await webflowClient.request<unknown>({
				auth: context.auth,
				method: HttpMethod.DELETE,
				path: `/sites/${context.propsValue.site_id}/webhooks/${response.webhookId}`,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	},
	async run(context) {
		const body = context.payload.body;
		const { formName } = context.propsValue;
		if (formName) {
			const name = typeof body === 'object' && body !== null && 'name' in body ? body.name : undefined;
			return name == formName ? [body] : [];
		}
		return [body];
	},
});

type WebhookInformation = {
	webhookId: string;
};
