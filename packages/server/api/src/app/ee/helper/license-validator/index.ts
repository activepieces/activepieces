import { ApEnvironment } from '../../../../../../../shared/src'
import { LicenseValidator } from './license-validator'
import { networkLicenseValidator } from './network-license-validator'
import { noOpLicenseValidator } from './no-op-license-validator'


export const variant: Record<ApEnvironment, LicenseValidator> = {
    [ApEnvironment.PRODUCTION]: networkLicenseValidator,
    [ApEnvironment.DEVELOPMENT]: noOpLicenseValidator,
    [ApEnvironment.TESTING]: noOpLicenseValidator,
}

