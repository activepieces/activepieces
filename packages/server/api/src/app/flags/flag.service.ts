import { AppSystemProp, apVersionUtil, webhookSecretsUtils } from '@activepieces/server-shared'
import { ApEdition, ApFlagId, ExecutionMode, Flag, isNil } from '@activepieces/shared'
import { In } from 'typeorm'
import { aiProviderService } from '../ai/ai-provider-service'
import { repoFactory } from '../core/db/repo-factory'
import { federatedAuthnService } from '../ee/authentication/federated-authn/federated-authn-service'
import { domainHelper } from '../ee/custom-domains/domain-helper'
import { system } from '../helper/system/system'
import { FlagEntity } from './flag.entity'
import { defaultTheme } from './theme'

const flagRepo = repoFactory(FlagEntity)


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
                ApFlagId.CURRENT_VERSION,
                ApFlagId.EDITION,
                ApFlagId.EMAIL_AUTH_ENABLED,
                ApFlagId.EXECUTION_DATA_RETENTION_DAYS,
                ApFlagId.ENVIRONMENT,
                ApFlagId.PUBLIC_URL,
                ApFlagId.LATEST_VERSION,
                ApFlagId.PRIVACY_POLICY_URL,
                ApFlagId.PIECES_SYNC_MODE,
                ApFlagId.PRIVATE_PIECES_ENABLED,
                ApFlagId.FLOW_RUN_TIME_SECONDS,
                ApFlagId.SHOW_COMMUNITY,
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
                ApFlagId.MAX_FIELDS_PER_TABLE,
                ApFlagId.MAX_RECORDS_PER_TABLE,
                ApFlagId.MAX_FILE_SIZE_MB,
                ApFlagId.SHOW_CHANGELOG,
            ]),
        })
        const now = new Date().toISOString()
        const created = now
        const updated = now
        const currentVersion = await apVersionUtil.getCurrentRelease()
        const latestVersion = await apVersionUtil.getLatestRelease()
        flags.push(
            {
                id: ApFlagId.ENVIRONMENT,
                value: system.get(AppSystemProp.ENVIRONMENT),
                created,
                updated,
            },
            {
                id: ApFlagId.AGENTS_CONFIGURED,
                value: await aiProviderService.isAgentConfigured(),
                created,
                updated,
            },
            {
                id: ApFlagId.CAN_CONFIGURE_AI_PROVIDER,
                value: true,
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
                id: ApFlagId.PIECES_SYNC_MODE,
                value: system.get(AppSystemProp.PIECES_SYNC_MODE),
                created,
                updated,
            },
            {
                id: ApFlagId.ENABLE_FLOW_ON_PUBLISH,
                value: system.getBoolean(AppSystemProp.ENABLE_FLOW_ON_PUBLISH) ?? true,
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
                id: ApFlagId.CLOUD_AUTH_ENABLED,
                value: system.getBoolean(AppSystemProp.CLOUD_AUTH_ENABLED) ?? true,
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
                value: await federatedAuthnService(system.globalLogger()).getThirdPartyRedirectUrl(undefined),
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
                id: ApFlagId.SHOW_COMMUNITY,
                value: system.getEdition() !== ApEdition.ENTERPRISE,
                created,
                updated,
            },
            {
                id: ApFlagId.SHOW_CHANGELOG,
                value: true,
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
                id: ApFlagId.PUBLIC_URL,
                value: await domainHelper.getPublicUrl({
                    path: '',
                }),
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
                id: ApFlagId.FLOW_RUN_MEMORY_LIMIT_KB,
                value: system.getNumber(AppSystemProp.SANDBOX_MEMORY_LIMIT),
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
            {
                id: ApFlagId.MAX_RECORDS_PER_TABLE,
                value: system.getNumber(AppSystemProp.MAX_RECORDS_PER_TABLE),
                created,
                updated,
            },
            {
                id: ApFlagId.MAX_FIELDS_PER_TABLE,
                value: system.getNumber(AppSystemProp.MAX_FIELDS_PER_TABLE),
                created,
                updated,
            },
            {
                id: ApFlagId.MAX_FILE_SIZE_MB,
                value: system.getNumber(AppSystemProp.MAX_FILE_SIZE_MB),
                created,
                updated,
            },
            {
                id: ApFlagId.SHOW_TUTORIALS,
                value: true,
                created,
                updated,
            },
        )

        if (system.isApp()) {
            flags.push(
                {
                    id: ApFlagId.WEBHOOK_URL_PREFIX,
                    value: await domainHelper.getPublicApiUrl({
                        path: 'v1/webhooks',
                    }),
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
    | BaseFlagStructure<ApFlagId.PUBLIC_URL, string>
    | BaseFlagStructure<ApFlagId.TELEMETRY_ENABLED, boolean>
    | BaseFlagStructure<ApFlagId.USER_CREATED, boolean>
    | BaseFlagStructure<ApFlagId.WEBHOOK_URL_PREFIX, string>

type BaseFlagStructure<K extends ApFlagId, V> = {
    id: K
    value: V
}
