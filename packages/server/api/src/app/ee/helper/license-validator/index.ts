import { platformService } from '../../../platform/platform.service'
import { LiceneseStatus, LicenseValidator } from './license-validator'
import { networkLicenseValidator } from './network-license-validator'
import { noOpLicenseValidator } from './no-op-license-validator'
import { logger, system, SystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment } from '@activepieces/shared'

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
                showPoweredBy: license.showPoweredBy,
                embeddingEnabled: license.embeddingEnabled,
                ssoEnabled: license.ssoEnabled,
                auditLogEnabled: license.auditLogEnabled,
                flowIssuesEnabled: license.flowIssuesEnabled,
                gitSyncEnabled: license.gitSyncEnabled,
                customDomainsEnabled: license.customDomainsEnabled,
                customAppearanceEnabled: license.customAppearanceEnabled,
                manageProjectsEnabled: license.manageProjectsEnabled,
                managePiecesEnabled: license.managePiecesEnabled,
                manageTemplatesEnabled: license.manageTemplatesEnabled,
                apiKeysEnabled: license.apiKeysEnabled,
                projectRolesEnabled: license.projectRolesEnabled,
                alertsEnabled: license.alertsEnabled,
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
