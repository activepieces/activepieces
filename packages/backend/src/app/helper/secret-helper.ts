import { ApEdition, FlowVersion, isNil } from '@activepieces/shared'
import { system } from './system/system'
import { SystemProp } from './system/system-prop'

let webhookSecrets: Record<string, string> | undefined = undefined

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
        webhookSecrets = await getWebhookSecrets()
    }
    return webhookSecrets[appName]
}

async function getWebhookSecrets(): Promise<Record<string, string>> {
    const currentEdition = getEdition()
    if (currentEdition !== ApEdition.CLOUD) {
        return {}
    }
    return JSON.parse(system.getOrThrow(SystemProp.APP_WEBHOOK_SECRETS))
}
