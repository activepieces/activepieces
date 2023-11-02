import axios from 'axios'
import { logger } from '../../../helper/logger'
import { LicenseValidator } from './license-validator'
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'

export const networkLicenseValidator: LicenseValidator = {
    async validate() {
        const license = obtainLicense()
        try {
            const res = await axios.post('https://secrets.activepieces.com/verify', { licenseKey: license })
            logger.debug({ name: 'NetworkLicenseValidator#validate', response: res.data })
            return res.status === 200
        }
        catch (err) {
            logger.error({ name: 'NetworkLicenseValidator#validate', err })
            // TODO FIX
            return true
        }
    },
}

const obtainLicense = (): string => {
    return system.getOrThrow(SystemProp.LICENSE_KEY)
}
