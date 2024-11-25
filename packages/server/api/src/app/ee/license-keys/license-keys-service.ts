import { logger, rejectedPromiseHandler } from '@activepieces/server-shared'
import { ActivepiecesError, ApEdition, CreateTrialLicenseKeyRequestBody, ErrorCode, isNil, LicenseKeyEntity, PackageType, PlatformRole, TelemetryEventName, UserStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { StatusCodes } from 'http-status-codes'
import { flagService } from '../../flags/flag.service'
import { telemetry } from '../../helper/telemetry.utils'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { platformService } from '../../platform/platform.service'
import { userService } from '../../user/user-service'


const secretManagerLicenseKeysRoute = 'https://secrets.activepieces.com/license-keys'

const handleUnexpectedSecretsManagerError = (message: string) => {
    logger.error(`[ERROR]: Unexpected error from secret manager: ${message}`)
    throw new Error(message)
}

export const licenseKeysService = {
    async requestTrial(request: CreateTrialLicenseKeyRequestBody): Promise<void> {
        const response = await fetch(secretManagerLicenseKeysRoute, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        })
        if (response.status === StatusCodes.CONFLICT) {
            throw new ActivepiecesError({
                code: ErrorCode.EMAIL_ALREADY_HAS_ACTIVATION_KEY,
                params: request,
            })
        }
        if (!response.ok) {
            const errorMessage = JSON.stringify(await response.json())
            handleUnexpectedSecretsManagerError(errorMessage)
        }
    },
    async markAsActiviated(request: { key: string, platformId: string }): Promise<void> {
        try {
            const response = await fetch(`${secretManagerLicenseKeysRoute}/activate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            })
            if (response.status === StatusCodes.CONFLICT) {
                return
            }
            if (response.status === StatusCodes.NOT_FOUND) {
                return
            }
            if (!response.ok) {
                const errorMessage = JSON.stringify(await response.json())
                handleUnexpectedSecretsManagerError(errorMessage)
            }
            rejectedPromiseHandler(telemetry.trackPlatform(request.platformId, {
                name: TelemetryEventName.KEY_ACTIVIATED,
                payload: {
                    date: dayjs().toISOString(),
                    key: request.key,
                },
            }))
        }
        catch (e) {
            // ignore
        }
    },
    async getKey(license: string | undefined): Promise<LicenseKeyEntity | null> {
        if (isNil(license)) {
            return null
        }
        const response = await fetch(`${secretManagerLicenseKeysRoute}/${license}`)
        if (response.status === StatusCodes.NOT_FOUND) {
            return null
        }
        if (!response.ok) {
            const errorMessage = JSON.stringify(await response.json())
            handleUnexpectedSecretsManagerError(errorMessage)
        }
        return response.json()
    },
    async verifyKeyOrReturnNull({ platformId, license }: { license: string | undefined, platformId: string }): Promise<LicenseKeyEntity | null  > {
        if (isNil(license)) {
            return null
        }
        await this.markAsActiviated({ key: license, platformId })
        const key = await this.getKey(license)
        const isExpired = isNil(key) || dayjs(key.expiresAt).isBefore(dayjs())
        return isExpired ? null : key
    },
    async downgradeToFreePlan(platformId: string): Promise<void> {
        await platformService.update({
            id: platformId,
            ...turnedOffFeatures,
        })
        await deactivatePlatformUsersOtherThanAdmin(platformId)
        await deletePrivatePieces(platformId)
    },
    async applyLimits(platformId: string, key: LicenseKeyEntity): Promise<void> {
        await platformService.update({
            id: platformId,
            ssoEnabled: key.ssoEnabled,
            gitSyncEnabled: key.gitSyncEnabled,
            showPoweredBy: key.showPoweredBy,
            embeddingEnabled: key.embeddingEnabled,
            auditLogEnabled: key.auditLogEnabled,
            customAppearanceEnabled: key.customAppearanceEnabled,
            globalConnectionsEnabled: key.globalConnectionsEnabled,
            customRolesEnabled: key.customRolesEnabled,
            manageProjectsEnabled: key.manageProjectsEnabled,
            managePiecesEnabled: key.managePiecesEnabled,
            manageTemplatesEnabled: key.manageTemplatesEnabled,
            apiKeysEnabled: key.apiKeysEnabled,
            customDomainsEnabled: key.customDomainsEnabled,
            projectRolesEnabled: key.projectRolesEnabled,
            flowIssuesEnabled: key.flowIssuesEnabled,
            alertsEnabled: key.alertsEnabled,
            analyticsEnabled: key.analyticsEnabled,
        })
    },
}

const deactivatePlatformUsersOtherThanAdmin: (platformId: string) => Promise<void> = async (platformId: string) => {
    const { data } = await userService.list({
        platformId,
    })
    const users = data.filter(f => f.platformRole !== PlatformRole.ADMIN).map(u => {
        logger.debug(`Deactivating user ${u.email}`)
        return userService.update({
            id: u.id,
            status: UserStatus.INACTIVE,
            platformId,
            platformRole: u.platformRole,
        })
    })
    await Promise.all(users)
}


const deletePrivatePieces: (platformId: string) => Promise<void> = async (platformId: string) => {
    const latestRelease = await flagService.getCurrentRelease()
    const pieces = await pieceMetadataService.list({
        edition: ApEdition.ENTERPRISE,
        includeHidden: true,
        release: latestRelease,
        platformId,
    })
    const piecesToDelete = pieces.filter((piece) => piece.packageType === PackageType.ARCHIVE && piece.id).map((piece) =>
        pieceMetadataService.delete({
            id: piece.id!,
            projectId: piece.projectId,
        }),
    )
    await Promise.all(piecesToDelete)
}



const turnedOffFeatures: Omit<LicenseKeyEntity, 'id' | 'createdAt' | 'expiresAt' | 'activatedAt' | 'isTrial' | 'email' | 'customerName' | 'key'> = {
    ssoEnabled: false,
    analyticsEnabled: false,
    gitSyncEnabled: false,
    showPoweredBy: false,
    embeddingEnabled: false,
    auditLogEnabled: false,
    customAppearanceEnabled: false,
    manageProjectsEnabled: false,
    managePiecesEnabled: false,
    manageTemplatesEnabled: false,
    apiKeysEnabled: false,
    customDomainsEnabled: false,
    globalConnectionsEnabled: false,
    customRolesEnabled: false,
    projectRolesEnabled: false,
    flowIssuesEnabled: false,
    alertsEnabled: false,
}
