import { LicenseValidator } from './license-validator'

export const noOpLicenseValidator: LicenseValidator = {
    async validate() {
        return true
    },
}
