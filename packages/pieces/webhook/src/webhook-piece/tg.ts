import {
    ApEnvironment,
    ApObject,
    createTriggerSchema,
    PieceEventName,
    PieceMetadata,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { WebhookPayload } from '@activepieces/shared';
import { pieceHelper } from '@activepieces/pieces-framework';
import { Webhook, WebhookRequest } from './webhook';

export class WebhookTriggerBuilder {
    piece(): PieceMetadata {
        return pieceHelper.createPiece('webhook')
            .withName('Webhook')
            .withLogoUrl('https://cdn.activepieces.com/pieces/webhook.png')
            .withTrigger(new WebhookTrigger())
            .build();
    }
}

export class WebhookTrigger extends Webhook<WebhookPayload> {
    static triggerName = 'webhook';
    static pieceName = 'webhook';
    static summary = 'Triggers a flow on an incoming HTTP request';

    async createAndSaveTriggerEvent(
        flowId: string,
        projectId: string,
        payload: any,
        webhookRequest: WebhookRequest,
    ): Promise<ApObject> {
        const rawRequest = {
            body: webhookRequest.body,
            headers: webhookRequest.headers,
            query: webhookRequest.query,
        };

        const triggerEvent = await this.helper.triggerEventService.create({
            flowId,
            projectId,
            payload,
            status: 'SUCCEEDED' as any,
            rawRequest,
        });

        return {
            id: triggerEvent.id,
            name: PieceEventName.TriggerRun,
            payload,
            respond: {
                statusCode: 200,
                body: JSON.stringify({ success: true }),
            },
        };
    }

    async onConnect(): Promise<void> {
        return;
    }

    async onDisconnect(): Promise<void> {
        return;
    }

    async test(): Promise<unknown> {
        return {
            success: true,
        };
    }

    async trigger(
        webhookRequest: WebhookRequest,
    ): Promise<[PieceEventName, ApObject][]> {
        const payload = this.getPayloadFromWebhook(webhookRequest);
        const triggerEvent = await this.createAndSaveTriggerEvent(
            this.flowId,
            this.projectId,
            payload,
            webhookRequest,
        );
        return [[PieceEventName.TriggerRun, triggerEvent]];
    }

    getPayloadFromWebhook(webhookRequest: WebhookRequest): any {
        return webhookRequest.body;
    }

    static s(): TriggerStrategy<WebhookTrigger, WebhookPayload> {
        return createTriggerSchema(WebhookTrigger)
            .withName(WebhookTrigger.triggerName)
            .withSummary(WebhookTrigger.summary)
            .withInterceptor(WebhookTrigger.interceptor)
            .withPayloadBuilder(new WebhookPayloadBuilder())
            .withHttpAction(WebhookTrigger.httpAction)
            .build();
    }
}