import { networkUtls, webhookSecretsUtils, WorkerSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, ApFlagId, ExecutionMode, Flag, isNil } from '@activepieces/shared'
import axios from 'axios'
import { In } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-prop'
import { FlagEntity } from './flag.entity'
import { defaultTheme } from './theme'

const flagRepo = repoFactory(FlagEntity)

let cachedVersion: string | undefined

export const flagService = {
    save: async (flag: FlagType): Promise<Flag> => {
        return flagRepo().save({
            id: flag.id,
            value: flag.value,
        })
    },
    async getOne(flagId: ApFlagId): Promise<Flag | null> {
        return flagRepo().findOneBy({ id: flagId })
    },
    async getAll(): Promise<Flag[]> {
        const flags = await flagRepo().findBy({
            id: In([
                ApFlagId.SHOW_POWERED_BY_IN_FORM,
                ApFlagId.CLOUD_AUTH_ENABLED,
                ApFlagId.CODE_COPILOT_ENABLED,
                ApFlagId.HTTP_REQUEST_COPILOT_ENABLED,
                ApFlagId.PROJECT_LIMITS_ENABLED,
                ApFlagId.CURRENT_VERSION,
                ApFlagId.EDITION,
                ApFlagId.IS_CLOUD_PLATFORM,
                ApFlagId.EMAIL_AUTH_ENABLED,
                ApFlagId.EXECUTION_DATA_RETENTION_DAYS,
                ApFlagId.ENVIRONMENT,
                ApFlagId.FRONTEND_URL,
                ApFlagId.LATEST_VERSION,
                ApFlagId.OWN_AUTH2_ENABLED,
                ApFlagId.PRIVACY_POLICY_URL,
                ApFlagId.PIECES_SYNC_MODE,
                ApFlagId.PRIVATE_PIECES_ENABLED,
                ApFlagId.FLOW_RUN_TIME_SECONDS,
                ApFlagId.SHOW_BILLING,
                ApFlagId.INSTALL_PROJECT_PIECES_ENABLED,
                ApFlagId.MANAGE_PROJECT_PIECES_ENABLED,
                ApFlagId.SHOW_COMMUNITY,
                ApFlagId.SHOW_DOCS,
                ApFlagId.SHOW_PLATFORM_DEMO,
                ApFlagId.SHOW_SIGN_UP_LINK,
                ApFlagId.SHOW_REWARDS,
                ApFlagId.SUPPORTED_APP_WEBHOOKS,
                ApFlagId.TELEMETRY_ENABLED,
                ApFlagId.TEMPLATES_PROJECT_ID,
                ApFlagId.TERMS_OF_SERVICE_URL,
                ApFlagId.THEME,
                ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL,
                ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP,
                ApFlagId.SAML_AUTH_ACS_URL,
                ApFlagId.USER_CREATED,
                ApFlagId.WEBHOOK_URL_PREFIX,
                ApFlagId.ALLOW_NPM_PACKAGES_IN_CODE_STEP,
            ]),
        })
        const now = new Date().toISOString()
        const created = now
        const updated = now
        const currentVersion = await this.getCurrentRelease()
        const latestVersion = await this.getLatestRelease()
        flags.push(
            {
                id: ApFlagId.ENVIRONMENT,
                value: system.get(AppSystemProp.ENVIRONMENT),
                created,
                updated,
            },
            {
                id: ApFlagId.SHOW_POWERED_BY_IN_FORM,
                value: true,
                created,
                updated,
            },
            {
                id: ApFlagId.IS_CLOUD_PLATFORM,
                value: false,
                created,
                updated,
            },
            {
                id: ApFlagId.PIECES_SYNC_MODE,
                value: system.get(AppSystemProp.PIECES_SYNC_MODE),
                created,
                updated,
            },
            {
                id: ApFlagId.EXECUTION_DATA_RETENTION_DAYS,
                value: system.getNumber(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS),
                created,
                updated,
            },
            {
                id: ApFlagId.SHOW_PLATFORM_DEMO,
                value: [ApEdition.CLOUD].includes(system.getEdition()),
                created,
                updated,
            },
            {
                id: ApFlagId.OWN_AUTH2_ENABLED,
                value: true,
                created,
                updated,
            },
            {
                id: ApFlagId.SHOW_REWARDS,
                value: true,
                created,
                updated,
            },
            {
                id: ApFlagId.CLOUD_AUTH_ENABLED,
                value: system.getBoolean(AppSystemProp.CLOUD_AUTH_ENABLED) ?? true,
                created,
                updated,
            },
            {
                id: ApFlagId.PROJECT_LIMITS_ENABLED,
                value: false,
                created,
                updated,
            },
            {
                id: ApFlagId.CODE_COPILOT_ENABLED,
                value: !isNil(system.get(AppSystemProp.OPENAI_API_KEY)),
                created,
                updated,
            },
            {
                id: ApFlagId.HTTP_REQUEST_COPILOT_ENABLED,
                value: !isNil(system.get(AppSystemProp.OPENAI_API_KEY)),
                created,
                updated,
            },
            {
                id: ApFlagId.INSTALL_PROJECT_PIECES_ENABLED,
                value: true,
                created,
                updated,
            },
            {
                id: ApFlagId.MANAGE_PROJECT_PIECES_ENABLED,
                value: false,
                created,
                updated,
            },
            {
                id: ApFlagId.SHOW_SIGN_UP_LINK,
                value: true,
                created,
                updated,
            },
            {
                id: ApFlagId.EDITION,
                value: system.getEdition(),
                created,
                updated,
            },
            {
                id: ApFlagId.SHOW_BILLING,
                value: system.getEdition() === ApEdition.CLOUD,
                created,
                updated,
            },
            {
                id: ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP,
                value: {},
                created,
                updated,
            },
            {
                id: ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL,
                value: [ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(system.getEdition())
                    ? this.getThirdPartyRedirectUrl(undefined, undefined)
                    : `${system.get(WorkerSystemProp.FRONTEND_URL)}/redirect`,
                created,
                updated,
            },
            {
                id: ApFlagId.EMAIL_AUTH_ENABLED,
                value: true,
                created,
                updated,
            },
            {
                id: ApFlagId.THEME,
                value: defaultTheme,
                created,
                updated,
            },
            {
                id: ApFlagId.SHOW_DOCS,
                value: system.getEdition() !== ApEdition.ENTERPRISE,
                created,
                updated,
            },
            {
                id: ApFlagId.SHOW_COMMUNITY,
                value: system.getEdition() !== ApEdition.ENTERPRISE,
                created,
                updated,
            },
            {
                id: ApFlagId.PRIVATE_PIECES_ENABLED,
                value: system.getEdition() !== ApEdition.COMMUNITY,
                created,
                updated,
            },
            {
                id: ApFlagId.PRIVACY_POLICY_URL,
                value: 'https://www.activepieces.com/privacy',
                created,
                updated,
            },
            {
                id: ApFlagId.TERMS_OF_SERVICE_URL,
                value: 'https://www.activepieces.com/terms',
                created,
                updated,
            },
            {
                id: ApFlagId.TELEMETRY_ENABLED,
                value: system.getBoolean(AppSystemProp.TELEMETRY_ENABLED) ?? true,
                created,
                updated,
            },
            {
                id: ApFlagId.FRONTEND_URL,
                value: system.get(WorkerSystemProp.FRONTEND_URL),
                created,
                updated,
            },
            {
                id: ApFlagId.FLOW_RUN_TIME_SECONDS,
                value: system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS),
                created,
                updated,
            },
            {
                id: ApFlagId.PAUSED_FLOW_TIMEOUT_DAYS,
                value: system.getNumber(AppSystemProp.PAUSED_FLOW_TIMEOUT_DAYS),
                created,
                updated,
            },
            {
                id: ApFlagId.WEBHOOK_TIMEOUT_SECONDS,
                value: system.getNumber(AppSystemProp.WEBHOOK_TIMEOUT_SECONDS),
                created,
                updated,
            },
            {
                id: ApFlagId.CURRENT_VERSION,
                value: currentVersion,
                created,
                updated,
            },
            {
                id: ApFlagId.LATEST_VERSION,
                value: latestVersion,
                created,
                updated,
            },
            {
                id: ApFlagId.ALLOW_NPM_PACKAGES_IN_CODE_STEP,
                value: system.get(AppSystemProp.EXECUTION_MODE) !== ExecutionMode.SANDBOX_CODE_ONLY,
                created,
                updated,
            },
        )

        if (system.isApp()) {
            flags.push(
                {
                    id: ApFlagId.WEBHOOK_URL_PREFIX,
                    value: await getWebhookPrefix(),
                    created,
                    updated,
                },
                {
                    id: ApFlagId.SUPPORTED_APP_WEBHOOKS,
                    value: getSupportedAppWebhooks(),
                    created,
                    updated,
                },
            )
        }
        return flags
    },
    getThirdPartyRedirectUrl(
        platformId: string | undefined,
        hostUrl: string | undefined,
    ): string {
        const isCustomerPlatform =
            platformId && !flagService.isCloudPlatform(platformId)
        if (isCustomerPlatform && system.getEdition() === ApEdition.CLOUD) {
            return `https://${hostUrl}/redirect`
        }
        const frontendUrl = system.get(WorkerSystemProp.FRONTEND_URL)
        const trimmedFrontendUrl = frontendUrl?.endsWith('/')
            ? frontendUrl.slice(0, -1)
            : frontendUrl
        return `${trimmedFrontendUrl}/redirect`
    },
    async getCurrentRelease(): Promise<string> {
        const packageJson = await import('package.json')
        return packageJson.version
    },
    async getLatestRelease(): Promise<string> {
        try {
            if (cachedVersion) {
                return cachedVersion
            }
            const response = await axios.get<PackageJson>(
                'https://raw.githubusercontent.com/activepieces/activepieces/main/package.json',
                {
                    timeout: 5000,
                },
            )
            cachedVersion = response.data.version
            return response.data.version
        }
        catch (ex) {
            return '0.0.0'
        }
    },
    isCloudPlatform(platformId: string | null): boolean {
        const cloudPlatformId = system.get(AppSystemProp.CLOUD_PLATFORM_ID)
        if (!cloudPlatformId || !platformId) {
            return false
        }
        return platformId === cloudPlatformId
    },
}


async function getWebhookPrefix(): Promise<string> {
    return `${await networkUtls.getPublicUrl(system.getOrThrow<ApEnvironment>(AppSystemProp.ENVIRONMENT), system.getOrThrow(WorkerSystemProp.FRONTEND_URL))}v1/webhooks`
}

function getSupportedAppWebhooks(): string[] {
    const webhookSecrets = system.get(AppSystemProp.APP_WEBHOOK_SECRETS)
    if (isNil(webhookSecrets)) {
        return []
    }
    const parsed = webhookSecretsUtils.parseWebhookSecrets(webhookSecrets)
    return Object.keys(parsed)
}



export type FlagType =
    | BaseFlagStructure<ApFlagId.FRONTEND_URL, string>
    | BaseFlagStructure<ApFlagId.TELEMETRY_ENABLED, boolean>
    | BaseFlagStructure<ApFlagId.USER_CREATED, boolean>
    | BaseFlagStructure<ApFlagId.WEBHOOK_URL_PREFIX, string>

type BaseFlagStructure<K extends ApFlagId, V> = {
    id: K
    value: V
}

type PackageJson = {
    version: string
}
