import { captureException } from '@sentry/node'
import axios from 'axios'
import { ApEdition, FlowVersion } from '@activepieces/shared'
import { system } from './system/system'
import { SystemProp } from './system/system-prop'

let edition: string | undefined = undefined
let webhookSecrets: Record<string, string> | undefined  = undefined

async function verifyLicense(licenseKey: string): Promise<boolean> {
    try {
        const response =
            await axios.post(
                'https://secrets.activepieces.com/verify', { licenseKey })
        return response.status === 200
    }
    catch (e) {
        return false
    }
}

export function isCloud() {
    return system.get(SystemProp.LICENSE_KEY) !== undefined
}

export async function getEdition(): Promise<string> {
    if (edition === undefined) {
        const licenseKey = system.get(SystemProp.LICENSE_KEY)
        if (licenseKey) {
            edition = (await verifyLicense(licenseKey)) ? 'ee' : 'ce'
        }
        else {
            edition = 'ce'
        }
    }

    return edition
}

export async function getWebhookSecret(flowVersion: FlowVersion): Promise<string | undefined> {
    const appName = flowVersion.trigger?.settings['pieceName']
    if(!appName) {
        return undefined
    }
    if (webhookSecrets === undefined) {
        webhookSecrets = await getWebhookSecrets()
    }
    return webhookSecrets[appName]
}

async function getWebhookSecrets(): Promise<Record<string, string>> {
    const currentEdition = await getEdition()
    if (currentEdition === ApEdition.COMMUNITY) {
        return {}
    }
    try {
        const licenseKey = system.get(SystemProp.LICENSE_KEY)
        const response = await axios.post(
            'https://secrets.activepieces.com/webhooks', { licenseKey })
        return response.data
    }
    catch (e) {
        captureException(e)
        throw e
    }
}
