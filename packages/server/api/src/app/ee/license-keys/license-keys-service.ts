import { AppSystemProp, rejectedPromiseHandler } from '@activepieces/server-shared'
import { ActivepiecesError, ApEdition, CreateTrialLicenseKeyRequestBody, ErrorCode, isNil, LicenseKeyEntity, TelemetryEventName } from '@activepieces/shared'
import { PlanName } from '@ee/shared/src/lib/billing'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { system } from '../../helper/system/system'
import { telemetry } from '../../helper/telemetry.utils'
import { platformService } from '../../platform/platform.service'
import { PlatformPlanHelper } from '../platform/platform-plan/platform-plan-helper'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'

const secretManagerLicenseKeysRoute = 'https://secrets.activepieces.com/license-keys'

const handleUnexpectedSecretsManagerError = (log: FastifyBaseLogger, message: string) => {
    log.error(`[ERROR]: Unexpected error from secret manager: ${message}`)
    throw new Error(message)
}

export const licenseKeysService = (log: FastifyBaseLogger) => ({
    async requestTrial(request: CreateTrialLicenseKeyRequestBody): Promise<LicenseKeyEntity> {
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
        return responseBody
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
                    name: TelemetryEventName.KEY_ACTIVATED,
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
    async verifyKeyOrReturnNull({ platformId, license }: { license: string | undefined, platformId: string }): Promise<LicenseKeyEntity | null> {
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
        await platformPlanService(log).update({ ...turnedOffFeatures, platformId })
        await platformService.update({
            id: platformId,
            plan: {
                ...turnedOffFeatures,
            },
        })
        await PlatformPlanHelper.handleResourceLocking({
            platformId, 
            newLimits: {
                userSeatsLimit: 0,
            },
        })
    },
    async applyLimits(platformId: string, key: LicenseKeyEntity): Promise<void> {
        const isInternalPlan = !key.ssoEnabled && !key.embeddingEnabled && system.getEdition() === ApEdition.CLOUD
        await platformService.update({
            id: platformId,
            plan: {
                plan: isInternalPlan ? 'internal' : PlanName.ENTERPRISE,
                licenseKey: key.key,
                tasksLimit: undefined,
                licenseExpiresAt: key.expiresAt,
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
                agentsLimit: undefined,
                mcpsEnabled: key.mcpsEnabled,
                todosEnabled: key.todosEnabled,
                tablesEnabled: key.tablesEnabled,
                activeFlowsLimit: undefined,
                mcpLimit: undefined,
                projectsLimit: undefined,
                userSeatsLimit: undefined,
                stripeSubscriptionId: undefined,
                stripeSubscriptionStatus: undefined,
                eligibleForTrial: undefined,
                tablesLimit: undefined,
                agentsEnabled: key.agentsEnabled,
                manageTemplatesEnabled: key.manageTemplatesEnabled,
                apiKeysEnabled: key.apiKeysEnabled,
                customDomainsEnabled: key.customDomainsEnabled,
                projectRolesEnabled: key.projectRolesEnabled,
                analyticsEnabled: key.analyticsEnabled,
            },
        })
    },
})

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
    agentsEnabled: false,
    mcpsEnabled: false,
    tablesEnabled: false,
    todosEnabled: false,
}
