import { HttpMethod } from '@activepieces/pieces-common';
import {
	OutputSchema,
	TriggerStrategy,
	createTrigger,
	isNil,
} from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';

export const brevoRegisterTrigger = ({
	name,
	displayName,
	description,
	aiDescription,
	type,
	events,
	sampleData,
	outputSchema,
}: BrevoTriggerParams) =>
	createTrigger({
		auth: sendinblueAuth,
		name,
		displayName,
		description,
		classification: 'READ',
		aiMetadata: { description: aiDescription },
		type: TriggerStrategy.WEBHOOK,
		props: {},
		sampleData,
		outputSchema,
		async onEnable(context) {
			const webhook = await brevoCommon.apiCall<BrevoWebhookResponse>({
				apiKey: context.auth.secret_text,
				method: HttpMethod.POST,
				resourceUri: '/webhooks',
				body: {
					url: context.webhookUrl,
					description: `Activepieces - ${displayName}`,
					events,
					type,
				},
			});

			await context.store.put<BrevoWebhookInformation>(storeKey(name), {
				webhookId: webhook.id,
			});
		},
		async onDisable(context) {
			const information = await context.store.get<BrevoWebhookInformation>(
				storeKey(name),
			);

			if (isNil(information)) {
				return;
			}

			await brevoCommon.apiCall({
				apiKey: context.auth.secret_text,
				method: HttpMethod.DELETE,
				resourceUri: `/webhooks/${information.webhookId}`,
			});

			await context.store.delete(storeKey(name));
		},
		async run(context) {
			return [context.payload.body];
		},
	});

function storeKey(name: string): string {
	return `brevo_webhook_${name}`;
}

export type BrevoWebhookType = 'marketing' | 'transactional';

export type BrevoTriggerParams = {
	name: string;
	displayName: string;
	description: string;
	aiDescription: string;
	type: BrevoWebhookType;
	events: string[];
	sampleData: unknown;
	outputSchema: OutputSchema;
};

export type BrevoWebhookResponse = {
	id: number;
};

export type BrevoWebhookInformation = {
	webhookId: number;
};
