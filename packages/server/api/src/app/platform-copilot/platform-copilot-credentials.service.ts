import { apId, isNil } from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { encryptUtils } from '../helper/encryption'
import { PlatformCopilotCredentialsEntity, PlatformCopilotCredentialsSchema } from './platform-copilot-credentials.entity'

const credentialsRepo = repoFactory<PlatformCopilotCredentialsSchema>(PlatformCopilotCredentialsEntity)
const apiKeyCache = new Map<string, string>()

export const platformCopilotCredentialsService = {
    async getApiKey(platformId: string): Promise<string | null> {
        const cached = apiKeyCache.get(platformId)
        if (cached) return cached
        const row = await credentialsRepo().findOneBy({ platformId })
        if (isNil(row)) return null
        const decrypted = await encryptUtils.decryptString(row.copilotApiKey)
        apiKeyCache.set(platformId, decrypted)
        return decrypted
    },

    async saveApiKey({ platformId, copilotApiKey }: { platformId: string, copilotApiKey: string }): Promise<void> {
        const encrypted = await encryptUtils.encryptString(copilotApiKey)
        await credentialsRepo().upsert(
            {
                id: apId(),
                platformId,
                copilotApiKey: encrypted,
            },
            { conflictPaths: ['platformId'], skipUpdateIfNoValuesChanged: false },
        )
        apiKeyCache.set(platformId, copilotApiKey)
    },

    async clear(platformId: string): Promise<void> {
        await credentialsRepo().delete({ platformId })
        apiKeyCache.delete(platformId)
    },
}
