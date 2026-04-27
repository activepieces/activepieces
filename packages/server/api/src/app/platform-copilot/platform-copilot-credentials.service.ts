import { apId, isNil } from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { encryptUtils } from '../helper/encryption'
import { PlatformCopilotCredentialsEntity, PlatformCopilotCredentialsSchema } from './platform-copilot-credentials.entity'

const credentialsRepo = repoFactory<PlatformCopilotCredentialsSchema>(PlatformCopilotCredentialsEntity)

export const platformCopilotCredentialsService = {
    async getApiKey(platformId: string): Promise<string | null> {
        const row = await credentialsRepo().findOneBy({ platformId })
        if (isNil(row)) return null
        return encryptUtils.decryptString(row.copilotApiKey)
    },

    async saveApiKey({ platformId, copilotApiKey }: { platformId: string, copilotApiKey: string }): Promise<void> {
        const encrypted = await encryptUtils.encryptString(copilotApiKey)
        const existing = await credentialsRepo().findOneBy({ platformId })
        if (isNil(existing)) {
            await credentialsRepo().insert({
                id: apId(),
                platformId,
                copilotApiKey: encrypted,
            })
        }
        else {
            await credentialsRepo().update({ platformId }, { copilotApiKey: encrypted })
        }
    },

    async clear(platformId: string): Promise<void> {
        await credentialsRepo().delete({ platformId })
    },
}
