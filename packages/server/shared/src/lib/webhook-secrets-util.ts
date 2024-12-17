import { assertNotNullOrUndefined, FlowVersion, isNil } from '@activepieces/shared'

let webhookSecrets: Record<string, { webhookSecret: string }> | undefined = undefined

export const webhookSecretsUtils = {
    init,
    getWebhookSecret,
    getSupportedAppWebhooks,
}

async function init(_webhookSecrets: Record<string, { webhookSecret: string }>) {
    webhookSecrets = _webhookSecrets
}

async function getWebhookSecret(
    flowVersion: FlowVersion,
): Promise<string | undefined> {
    const appName = flowVersion.trigger.settings.pieceName
    if (!appName) {
        return undefined
    }
    assertNotNullOrUndefined(webhookSecrets, 'Webhook secrets are not initialized')
    const appConfig = webhookSecrets[appName]
    if (isNil(appConfig)) {
        return undefined
    }
    return appConfig.webhookSecret
}

function getSupportedAppWebhooks(): string[] {
    assertNotNullOrUndefined(webhookSecrets, 'Webhook secrets are not initialized')
    return Object.keys(webhookSecrets)
}

