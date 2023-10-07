import fetch from 'node-fetch'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'

export async function verifyLicenseKey(): Promise<boolean> {
    try {
        const res = await fetch('https://secrets.activepieces.com/verify', {
            method: 'POST',
            body: JSON.stringify({ licenseKey: system.get(SystemProp.LICENSE_KEY) }),
            headers: { 'Content-Type': 'application/json' },
        })
        return res.status === 200
    }
    catch (err) {
        return false
    }
}