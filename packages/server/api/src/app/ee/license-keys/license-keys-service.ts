import { AppSystemProp, rejectedPromiseHandler } from '@activepieces/server-shared'
import { ActivepiecesError, CreateTrialLicenseKeyRequestBody, ErrorCode, isNil, LicenseKeyEntity, PlatformRole, TelemetryEventName, UserStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { system } from '../../helper/system/system'
import { telemetry } from '../../helper/telemetry.utils'
import { platformService } from '../../platform/platform.service'
import { userService } from '../../user/user-service'

const secretManagerLicenseKeysRoute = 'https://secrets.activepieces.com/license-keys'

const handleUnexpectedSecretsManagerError = (log: FastifyBaseLogger, message: string) => {
    log.error(`[ERROR]: Unexpected error from secret manager: ${message}`)
    throw new Error(message)
}

export const licenseKeysService = (log: FastifyBaseLogger) => ({
    async  requestTrial(request: CreateTrialLicenseKeyRequestBody): Promise<string> {
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
            handleUnexpectedSecretsManagerError(log, errorMessage)
        }
        const responseBody = await response.json()
        return responseBody.key
    },
    async markAsActiviated(request: { key: string, platformId?: string }): Promise<void> {
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
                handleUnexpectedSecretsManagerError(log, errorMessage)
            }
            if (request.platformId) {
                rejectedPromiseHandler(telemetry(log).trackPlatform(request.platformId, {
                    name: TelemetryEventName.KEY_ACTIVIATED,
                    payload: {
                        date: dayjs().toISOString(),
                        key: request.key,
                    },
                }), log)
            }
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
            handleUnexpectedSecretsManagerError(log, errorMessage)
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
    async extendTrial({ email, days }: { email: string, days: number }): Promise<void> {
        const SECRET_MANAGER_API_KEY = system.getOrThrow(AppSystemProp.SECRET_MANAGER_API_KEY)
        const response = await fetch(`${secretManagerLicenseKeysRoute}/extend-trial`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': SECRET_MANAGER_API_KEY,
            },
            body: JSON.stringify({ email, days }),
        })

        if (response.status === StatusCodes.NOT_FOUND) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: 'License key not found',
                },
            })
        }

        if (!response.ok) {
            const errorMessage = JSON.stringify(await response.json())
            handleUnexpectedSecretsManagerError(log, errorMessage)
        }
    },
    async downgradeToFreePlan(platformId: string): Promise<void> {
        await platformService.update({
            id: platformId,
            ...turnedOffFeatures,
        })
        await deactivatePlatformUsersOtherThanAdmin(platformId)
    },
    async applyLimits(platformId: string, key: LicenseKeyEntity): Promise<void> {
        await platformService.update({
            id: platformId,
            ssoEnabled: key.ssoEnabled,
            environmentsEnabled: key.environmentsEnabled,
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
})

const deactivatePlatformUsersOtherThanAdmin: (platformId: string) => Promise<void> = async (platformId: string) => {
    const { data } = await userService.list({
        platformId,
    })
    const users = data.filter(f => f.platformRole !== PlatformRole.ADMIN).map(u => {
        return userService.update({
            id: u.id,
            status: UserStatus.INACTIVE,
            platformId,
            platformRole: u.platformRole,
        })
    })
    await Promise.all(users)
}

const turnedOffFeatures: Omit<LicenseKeyEntity, 'id' | 'createdAt' | 'expiresAt' | 'activatedAt' | 'isTrial' | 'email' | 'customerName' | 'key'> = {
    ssoEnabled: false,
    analyticsEnabled: false,
    environmentsEnabled: false,
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
