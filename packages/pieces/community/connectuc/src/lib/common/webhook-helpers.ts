import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { TriggerHookContext } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

export const CONNECTUC_BASE_URL = 'https://staging.connectuc.engineering/activepieces';
export const CONNECTUC_WEBHOOK_TRIGGER_KEY = 'connectuc_webhook';

interface WebhookResponse {
    id: string;
}

interface RegisterWebhookParams {
    auth: {
        access_token: string;
    };
    webhookUrl: string;
    event?: string;  // Singular event type
    events?: string[];  // Array of event types (for future use)
    context: TriggerHookContext<any, any, any>;
}

interface UnregisterWebhookParams {
    auth: {
        access_token: string;
    };
    webhookUrl: string;
    context: TriggerHookContext<any, any, any>;
}

/**
 * Registers a webhook with the ConnectUC API
 * @param params - Registration parameters including auth, webhook URL, events, and context
 * @returns The webhook response containing the webhook ID
 */
export async function registerConnectUCWebhook(params: RegisterWebhookParams): Promise<WebhookResponse> {
    const { auth, webhookUrl, event, events, context } = params;

    try {
        // Get project external ID (optional, may be undefined)
        let projectExternalId;
        try {
            projectExternalId = await context.project.externalId();
        } catch (error) {
            console.warn('Could not retrieve project external ID:', error);
            projectExternalId = undefined;
        }

        // Build webhook body
        const webhookBody: any = {
            url: webhookUrl,
            flowId: context.flows.current.id,
            flowVersionId: context.flows.current.version.id,
            stepName: context.step.name,
            projectId: context.project.id,
            projectExternalId,
            data: context.propsValue,  // Include trigger properties data
        };

        // Add event or events field
        if (event) {
            webhookBody.event = event;
        }
        if (events) {
            webhookBody.events = events;
        }

        // Create webhook with ConnectUC API
        const response = await httpClient.sendRequest<WebhookResponse>({
            method: HttpMethod.POST,
            url: `${CONNECTUC_BASE_URL}/webhook`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.access_token,
            },
            body: webhookBody,
        });

        console.log('Webhook created successfully:', response.body);

        // Store webhook ID for later deletion
        await context.store.put(CONNECTUC_WEBHOOK_TRIGGER_KEY, {
            webhookId: response.body.id,
        });

        return response.body;
    } catch (error) {
        console.error('Failed to create ConnectUC webhook:', error);
        throw error;
    }
}

/**
 * Unregisters a webhook from the ConnectUC API
 * @param params - Unregistration parameters including auth, context, and trigger key
 */
export async function unregisterConnectUCWebhook(params: UnregisterWebhookParams): Promise<void> {
    const { auth, webhookUrl, context } = params;
    const webhookData = await context.store.get<{ webhookId: string }>(CONNECTUC_WEBHOOK_TRIGGER_KEY);

    if (!isNil(webhookData) && !isNil(webhookData.webhookId)) {
        try {
            // Delete webhook from ConnectUC API
            await httpClient.sendRequest({
                method: HttpMethod.DELETE,
                url: `${CONNECTUC_BASE_URL}/webhook`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: auth.access_token,
                },
                body: {
                    url: webhookUrl,
                },
            });

            console.log('Webhook deleted successfully:', webhookData.webhookId);
        } catch (error) {
            console.error('Failed to delete ConnectUC webhook:', error);
            // Don't throw - webhook may already be deleted
        }
    }
}
