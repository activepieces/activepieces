import { LiceneseStatus, LicenseValidator } from './license-validator'

export const noOpLicenseValidator: LicenseValidator = {
    async validate() {
        return {
            status: LiceneseStatus.VALID,
        }
    },
}
