import axios from 'axios'
import { LiceneseStatus, LicenseValidator } from './license-validator'
import { logger, SystemProp, system } from '@activepieces/server-shared'
export const networkLicenseValidator: LicenseValidator = {
    async validate() {
        const license = obtainLicense()
        try {
            const res = await axios.post('https://secrets.activepieces.com/verify', {
                licenseKey: license,
            })
            logger.debug({
                name: 'NetworkLicenseValidator#validate',
                response: res.data,
            })
            if (res.status !== 200) {
                return {
                    status: LiceneseStatus.INVALID,
                }
            }
            return {
                status: LiceneseStatus.VALID,
                showPoweredBy: res.data.showPoweredBy,
                embeddingEnabled: res.data.embeddingEnabled,
                gitSyncEnabled: res.data.gitSyncEnabled,
                ssoEnabled: res.data.ssoEnabled,
                auditLogEnabled: res.data.auditLogEnabled,
            }
        }
        catch (err) {
            logger.error({ name: 'NetworkLicenseValidator#validate', err })
            return {
                status: LiceneseStatus.UNKNOWN,
            }
        }
    },
}

const obtainLicense = (): string => {
    return system.getOrThrow(SystemProp.LICENSE_KEY)
}
