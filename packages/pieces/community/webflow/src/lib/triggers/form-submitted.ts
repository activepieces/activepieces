import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { webflowAuth } from '../auth';
import { webflowClient } from '../common/client';
import { webflowProps } from '../common/props';
import type { WebflowWebhook } from '../common/types';
import { newSubmissionOutputSchema } from '../output-schemas';

const triggerNameInStore = 'webflow_created_form_submissions_trigger';

export const formSubmittedTrigger = createTrigger({
	auth: webflowAuth,
	name: 'new_submission',
	outputSchema: newSubmissionOutputSchema,
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
		siteId: '62749158efef318abc8d5a0f',
		data: {
			name: 'Arthur Dent',
			email: 'arthur.dent@mostlyharmless.com',
		},
		submittedAt: '2022-09-14T12:35:16.117Z',
		id: '6321ca84df3949bfc6752327',
		formId: '6321ca84df3949bfc6752328',
		formElementId: '4e038d2c-6a1e-4953-7be9-a59a2b453177',
	},
	async onEnable(context) {
		const webhook = await webflowClient.request<WebflowWebhook>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/v2/sites/${encodeURIComponent(context.propsValue.site_id)}/webhooks`,
			body: {
				triggerType: 'form_submission',
				url: context.webhookUrl,
			},
		});
		await context.store?.put<WebhookInformation>(triggerNameInStore, {
			webhookId: webhook.id,
		});
	},
	async onDisable(context) {
		const response = await context.store?.get<WebhookInformation>(triggerNameInStore);
		if (response === null || response === undefined) {
			return;
		}
		try {
			await webflowClient.request<unknown>({
				auth: context.auth,
				method: HttpMethod.DELETE,
				path: `/v2/webhooks/${encodeURIComponent(response.webhookId)}`,
			});
		} catch (error: unknown) {
			if (!(error instanceof HttpError && error.response.status === 404)) {
				throw error;
			}
		}
	},
	async run(context) {
		const body = context.payload.body;
		const submission =
			typeof body === 'object' && body !== null && 'payload' in body ? body.payload : body;
		const { formName } = context.propsValue;
		if (formName) {
			const name =
				typeof submission === 'object' && submission !== null && 'name' in submission
					? submission.name
					: undefined;
			return name == formName ? [submission] : [];
		}
		return [submission];
	},
});

type WebhookInformation = {
	webhookId: string;
};
