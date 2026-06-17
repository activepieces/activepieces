import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { BaseContext, InputPropertyMap, PieceAuthProperty } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

export const CONNECTUC_BASE_URL = 'https://api.connectuc.io/activepieces';
export const CONNECTUC_WEBHOOK_TRIGGER_KEY = 'connectuc_webhook';

interface WebhookResponse {
    id: string;
}

interface RegisterWebhookParams<
    PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined,
    Props extends InputPropertyMap
> {
    auth: {
        access_token: string;
    };
    webhookUrl: string;
    event?: string;
    events?: string[];
    context: BaseContext<PieceAuth, Props>;
}

interface UnregisterWebhookParams<
    PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined,
    Props extends InputPropertyMap
> {
    auth: {
        access_token: string;
    };
    webhookUrl: string;
    context: BaseContext<PieceAuth, Props>;
}

export async function registerConnectUCWebhook<
    PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined,
    Props extends InputPropertyMap
>(params: RegisterWebhookParams<PieceAuth, Props>): Promise<WebhookResponse> {
    const { auth, webhookUrl, event, events, context } = params;

    try {
        let projectExternalId;
        try {
            projectExternalId = await context.project.externalId();
        } catch {
            projectExternalId = undefined;
        }

        const webhookBody: Record<string, unknown> = {
            url: webhookUrl,
            flowId: context.flows.current.id,
            flowVersionId: context.flows.current.version.id,
            stepName: context.step.name,
            projectId: context.project.id,
            projectExternalId,
            data: context.propsValue,
        };

        if (event) {
            webhookBody['event'] = event;
        }
        if (events) {
            webhookBody['events'] = events;
        }

        const response = await httpClient.sendRequest<WebhookResponse>({
            method: HttpMethod.POST,
            url: `${CONNECTUC_BASE_URL}/webhook`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.access_token,
            },
            body: webhookBody,
        });

        await context.store.put(CONNECTUC_WEBHOOK_TRIGGER_KEY, {
            webhookId: response.body.id,
        });

        return response.body;
    } catch (error) {
        throw error;
    }
}

export async function unregisterConnectUCWebhook<
    PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined,
    Props extends InputPropertyMap
>(params: UnregisterWebhookParams<PieceAuth, Props>): Promise<void> {
    const { auth, webhookUrl, context } = params;
    const webhookData = await context.store.get<{ webhookId: string }>(CONNECTUC_WEBHOOK_TRIGGER_KEY);

    if (!isNil(webhookData) && !isNil(webhookData.webhookId)) {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.DELETE,
                url: `${CONNECTUC_BASE_URL}/webhook`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: auth.access_token,
                },
                body: {
                    url: webhookUrl,
                    webhookId: webhookData.webhookId,
                },
            });
        } catch {
            // webhook may already be deleted
        }
    }
}
