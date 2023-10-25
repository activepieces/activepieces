import { ApEdition, ApFlagId, Flag } from '@activepieces/shared'
import { databaseConnection } from '../database/database-connection'
import { system } from '../helper/system/system'
import { SystemProp } from '../helper/system/system-prop'
import { FlagEntity } from './flag.entity'
import axios from 'axios'
import { webhookService } from '../webhooks/webhook-service'
import { getEdition } from '../helper/secret-helper'
import { defaultTheme } from './theme'

const flagRepo = databaseConnection.getRepository(FlagEntity)

export const flagService = {
    save: async (flag: FlagType): Promise<Flag> => {
        return await flagRepo.save({
            id: flag.id,
            value: flag.value,
        })
    },
    async getOne(flagId: ApFlagId): Promise<Flag | null> {
        return await flagRepo.findOneBy({
            id: flagId,
        })
    },
    async getCurrentVersion(): Promise<string> {
        return (await import('package.json')).version
    },
    async getAll(): Promise<Flag[]> {
        const flags = await flagRepo.find({})
        const now = new Date().toISOString()
        const created = now
        const updated = now
        const currentVersion = (await this.getCurrentVersion())
        const latestVersion = (await this.getLatestPackageDotJson()).version
        flags.push(
            {
                id: ApFlagId.ENVIRONMENT,
                value: system.get(SystemProp.ENVIRONMENT),
                created,
                updated,
            },
            {
                id: ApFlagId.CHATBOT_ENABLED,
                value: getEdition() === ApEdition.ENTERPRISE ? false : system.getBoolean(SystemProp.CHATBOT_ENABLED),
                created,
                updated,
            },
            {
                id: ApFlagId.CLOUD_AUTH_ENABLED,
                value: system.getBoolean(SystemProp.CLOUD_AUTH_ENABLED) ?? true,
                created,
                updated,
            },
            {
                id: ApFlagId.EDITION,
                value: getEdition(),
                created,
                updated,
            },
            {
                id: ApFlagId.SHOW_BILLING,
                value: getEdition() === ApEdition.CLOUD,
                created,
                updated,
            },
            {
                id: ApFlagId.SHOW_AUTH_PROVIDERS,
                value: getEdition() === ApEdition.CLOUD,
                created,
                updated,
            },
            {
                id: ApFlagId.PROJECT_MEMBERS_ENABLED,
                value: getEdition() !== ApEdition.COMMUNITY,
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
                value: getEdition() !== ApEdition.ENTERPRISE,
                created,
                updated,
            },
            {
                id: ApFlagId.SHOW_COMMUNITY,
                value: getEdition() !== ApEdition.ENTERPRISE,
                created,
                updated,
            },
            {
                id: ApFlagId.PRIVATE_PIECES_ENABLED,
                value: getEdition() !== ApEdition.COMMUNITY,
                created,
                updated,
            },
            {
                id: ApFlagId.SIGN_UP_ENABLED,
                value: system.getBoolean(SystemProp.SIGN_UP_ENABLED) ?? false,
                created,
                updated,
            },
            {
                id: ApFlagId.TELEMETRY_ENABLED,
                value: system.getBoolean(SystemProp.TELEMETRY_ENABLED) ?? true,
                created,
                updated,
            },
            {
                id: ApFlagId.WEBHOOK_URL_PREFIX,
                value: await webhookService.getWebhookPrefix(),
                created,
                updated,
            },
            {
                id: ApFlagId.FRONTEND_URL,
                value: system.get(SystemProp.FRONTEND_URL),
                created,
                updated,
            },
            {
                id: ApFlagId.SHOW_BLOG_GUIDE,
                value: true,
                created,
                updated,
            },
            {
                id: ApFlagId.SANDBOX_RUN_TIME_SECONDS,
                value: system.getNumber(SystemProp.SANDBOX_RUN_TIME_SECONDS),
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
                id: ApFlagId.TEMPLATES_SOURCE_URL,
                value: system.get(SystemProp.TEMPLATES_SOURCE_URL),
                created,
                updated,
            },
            {
                id: ApFlagId.TEMPLATES_PROJECT_ID,
                value: system.get(SystemProp.TEMPLATES_PROJECT_ID),
                created,
                updated,
            },
        )

        return flags
    },
    async getCurrentRelease() {
        const currentVersion = (await import('package.json')).version
        return currentVersion
    },
    async getLatestPackageDotJson() {
        try {
            const pkgJson = (await axios.get('https://raw.githubusercontent.com/activepieces/activepieces/main/package.json')).data
            return pkgJson
        }
        catch (ex) {
            return { version: '0.0.0' }
        }
    },
}

export type FlagType =
    | BaseFlagStructure<ApFlagId.FRONTEND_URL, string>
    | BaseFlagStructure<ApFlagId.WEBHOOK_URL_PREFIX, string>
    | BaseFlagStructure<ApFlagId.USER_CREATED, boolean>
    | BaseFlagStructure<ApFlagId.TELEMETRY_ENABLED, boolean>

type BaseFlagStructure<K extends ApFlagId, V> = {
    id: K
    value: V
}
