import { ApEnvironment } from '@activepieces/shared'
import { LiceneseStatus, LicenseValidator } from './license-validator'
import { noOpLicenseValidator } from './no-op-license-validator'
import { networkLicenseValidator } from './network-license-validator'
import { ApEdition } from '@activepieces/shared'
import { SystemProp, system } from 'server-shared'
import { platformService } from '../../../platform/platform.service'
import { logger } from 'server-shared'

const variant: Record<ApEnvironment, LicenseValidator> = {
    [ApEnvironment.PRODUCTION]: networkLicenseValidator,
    [ApEnvironment.DEVELOPMENT]: noOpLicenseValidator,
    [ApEnvironment.TESTING]: noOpLicenseValidator,
}

const env = system.getOrThrow<ApEnvironment>(SystemProp.ENVIRONMENT)

const licenseValidator = variant[env]

export async function enforceLimits(): Promise<void> {
    const edition = system.getOrThrow<ApEdition>(SystemProp.EDITION)
    if (edition !== ApEdition.ENTERPRISE) {
        return
    }
    const license = await licenseValidator.validate()
    switch (license.status) {
        case LiceneseStatus.VALID: {
            const oldestPlatform = await platformService.getOldestPlatform()
            if (!oldestPlatform) {
                break
            }
            await platformService.update({
                id: oldestPlatform.id,
                userId: oldestPlatform.ownerId,
                showPoweredBy: license.showPoweredBy,
                embeddingEnabled: license.embeddingEnabled,
                ssoEnabled: license.ssoEnabled,
                auditLogEnabled: license.auditLogEnabled,
                gitSyncEnabled: license.gitSyncEnabled,
            })
            break
        }
        case LiceneseStatus.INVALID: {
            logger.error(
                '[ERROR]: License key is not valid. Please contact sales@activepieces.com',
            )
            process.exit(1)
            break
        }
        case LiceneseStatus.UNKNOWN: {
            // We don't want to block the application from starting if the license is unknown
            // TODO find a better way to handle this
            break
        }
    }
}
