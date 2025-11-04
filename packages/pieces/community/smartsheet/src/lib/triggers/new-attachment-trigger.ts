import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { smartsheetAuth } from '../../index';
import {
	smartsheetCommon,
	findOrCreateWebhook,
	WebhookInformation,
	verifyWebhookSignature,
	getAttachmentFullDetails,
} from '../common';
import { WebhookHandshakeStrategy } from '@activepieces/shared';

const TRIGGER_KEY = 'smartsheet_new_attachment_trigger';

export const newAttachmentTrigger = createTrigger({
	auth: smartsheetAuth,
	name: 'new_attachment_',
	displayName: 'New Attachment Added',
	description: 'Triggers when a new attachment is added to a row or sheet.',
	props: {
		sheet_id: smartsheetCommon.sheet_id(),
	},
	type: TriggerStrategy.WEBHOOK,
	sampleData: {
		sheetId: '12345',
		eventType: 'created',
		objectType: 'attachment',
		id: 78901, // Attachment ID
		parentId: 67890, // e.g., Row ID if attached to a row
		parentType: 'ROW',
		timestamp: '2023-10-28T12:10:00Z',
		userId: 54321,
		attachmentData: {
			/* ... full attachment data ... */
		},
	},
	handshakeConfiguration: {
		strategy: WebhookHandshakeStrategy.BODY_PARAM_PRESENT,
		paramName: 'challenge',
	},
	async onHandshake(context) {
		return {
			status: 200,
			body: {
				smartsheetHookResponse: (context.payload.body as any)['challenge'],
			},
		};
	},

	async onEnable(context) {
		const { sheet_id } = context.propsValue;
		if (!sheet_id) throw new Error('Sheet ID is required to enable the webhook.');

		const triggerIdentifier = context.webhookUrl.substring(context.webhookUrl.lastIndexOf('/') + 1);
		const webhook = await findOrCreateWebhook(
			context.auth as string,
			context.webhookUrl,
			sheet_id as string,
			triggerIdentifier,
		);

		await context.store.put<WebhookInformation>(TRIGGER_KEY, {
			webhookId: webhook.id.toString(),
			sharedSecret: webhook.sharedSecret,
			webhookName: webhook.name,
		});
	},

	async onDisable(context) {
		const { sheet_id } = context.propsValue;
		if (!sheet_id) throw new Error('Sheet ID is required to enable the webhook.');

		const triggerIdentifier = context.webhookUrl.substring(context.webhookUrl.lastIndexOf('/') + 1);
		const webhook = await findOrCreateWebhook(
			context.auth as string,
			context.webhookUrl,
			sheet_id as string,
			triggerIdentifier,
		);

		await context.store.put<WebhookInformation>(TRIGGER_KEY, {
			webhookId: webhook.id.toString(),
			sharedSecret: webhook.sharedSecret,
			webhookName: webhook.name,
		});
	},

	async run(context) {
		const payload = context.payload.body as any;
		const headers = context.payload.headers as Record<string, string | undefined>;
		const webhookInfo = await context.store.get<WebhookInformation>(TRIGGER_KEY);

		if (!webhookInfo) {
			return [];
		}

		if (headers && headers['smartsheet-hook-challenge']) {
			return [];
		}

		const webhookSecret = webhookInfo?.sharedSecret;
		const webhookSignatureHeader = context.payload.headers['smartsheet-hmac-sha256'];
		const rawBody = context.payload.rawBody;

		if (!verifyWebhookSignature(webhookSecret, webhookSignatureHeader, rawBody)) {
			return [];
		}

		if (payload.newWebhookStatus) {
			return [];
		}
		if (!payload.events || !Array.isArray(payload.events) || payload.events.length === 0) {
			return [];
		}

		const newAttachmentEvents = [];
		for (const event of payload.events) {
			if (event.objectType === 'attachment' && event.eventType === 'created') {
				const eventOutput: any = { ...event, sheetId: payload.scopeObjectId?.toString() };
				const objectSheetId = payload.scopeObjectId?.toString();
				if (objectSheetId) {
					try {
						eventOutput.attachmentData = await getAttachmentFullDetails(
							context.auth as string,
							objectSheetId,
							event.id.toString(),
						);
					} catch (error: any) {
						eventOutput.fetchError = error.message;
					}
				} else {
					eventOutput.fetchError = 'scopeObjectId missing';
				}

				newAttachmentEvents.push(eventOutput);
			}
		}
		return newAttachmentEvents;
	},
});
