import { assertNotNullOrUndefined, FlowVersion, isNil, parseToJsonIfPossible } from '@activepieces/shared'

let webhookSecrets: Record<string, { webhookSecret: string }> | undefined = undefined

export const webhookSecretsUtils = {
    init,
    getWebhookSecret,
    getSupportedAppWebhooks,
}

async function init(_webhookSecrets: string) {
    const parsed = parseToJsonIfPossible(_webhookSecrets) as Record<string, { webhookSecret: string }> | undefined
    assertNotNullOrUndefined(parsed, 'Failed to parse webhook secrets')
    webhookSecrets = parsed
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

