import axios from 'axios'
import { ApEdition, FlowVersion } from '@activepieces/shared'
import { system } from './system/system'
import { SystemProp } from './system/system-prop'
import { captureException } from './logger'
import { isNil } from 'lodash'

let webhookSecrets: Record<string, string> | undefined = undefined

export function getEdition(): ApEdition {
    const edition = system.get(SystemProp.EDITION)
    if (isNil(edition)) {
        return ApEdition.COMMUNITY
    }
    return edition as ApEdition
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
    if (currentEdition === ApEdition.COMMUNITY) {
        return {}
    }
    try {
        const licenseKey = system.get(SystemProp.LICENSE_KEY)
        const response = await axios.post(
            'https://secrets.activepieces.com/webhooks',
            { licenseKey },
        )
        return response.data
    }
    catch (e) {
        captureException(e)
        throw e
    }
}
