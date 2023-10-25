import { ApEnvironment } from '@activepieces/shared'
import { LicenseValidator } from './license-validator'
import { noOpLicenseValidator } from './no-op-license-validator'
import { networkLicenseValidator } from './network-license-validator'
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'

const variant: Record<ApEnvironment, LicenseValidator> = {
    [ApEnvironment.PRODUCTION]: networkLicenseValidator,
    [ApEnvironment.DEVELOPMENT]: noOpLicenseValidator,
    [ApEnvironment.TESTING]: noOpLicenseValidator,
}

const env = system.getOrThrow<ApEnvironment>(SystemProp.ENVIRONMENT)

export const licenseValidator = variant[env]
