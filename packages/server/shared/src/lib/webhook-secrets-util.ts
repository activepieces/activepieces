import { FlowVersion, isNil } from '@activepieces/shared'
import { system } from './system/system'
import { SharedSystemProp } from './system/system-prop'

let webhookSecrets: Record<string, { webhookSecret: string }> | undefined =
    undefined

export const webhookSecretsUtils = {
    getWebhookSecret,
    getSupportedAppWebhooks,
    getWebhookSecrets,
}

async function getWebhookSecret(
    flowVersion: FlowVersion,
): Promise<string | undefined> {
    const appName = flowVersion.trigger.settings.pieceName
    if (!appName) {
        return undefined
    }
    if (webhookSecrets === undefined) {
        webhookSecrets = getWebhookSecrets()
    }
    const appConfig = webhookSecrets[appName]
    if (isNil(appConfig)) {
        return undefined
    }
    return appConfig.webhookSecret
}

function getSupportedAppWebhooks(): string[] {
    return Object.keys(getWebhookSecrets())
}

function getWebhookSecrets(): Record<
string,
{
    webhookSecret: string
}
> {
    const appSecret = system.get(SharedSystemProp.APP_WEBHOOK_SECRETS)
    if (isNil(appSecret)) {
        return {}
    }
    return JSON.parse(appSecret)
}
