import { system, SystemProp } from '@activepieces/server-shared'
import { ApEdition, FlowVersion, isNil } from '@activepieces/shared'

let webhookSecrets: Record<string, { webhookSecret: string }> | undefined =
  undefined

export function getEdition(): ApEdition {
    const edition = system.get<ApEdition>(SystemProp.EDITION)

    if (isNil(edition)) {
        return ApEdition.COMMUNITY
    }

    return edition
}

export async function getWebhookSecret(
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

export function getSupportedAppWebhooks(): string[] {
    return Object.keys(getWebhookSecrets())
}

export function getWebhookSecrets(): Record<
string,
{
    webhookSecret: string
}
> {
    const appSecret = system.get(SystemProp.APP_WEBHOOK_SECRETS)
    if (isNil(appSecret)) {
        return {}
    }
    return JSON.parse(appSecret)
}
