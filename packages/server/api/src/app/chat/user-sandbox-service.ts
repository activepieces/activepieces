import { apId, isNil } from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { ChatAiConfig, chatSandboxAgent } from './sandbox/sandbox-agent'
import { UserSandboxEntity } from './user-sandbox-entity'

const userSandboxRepo = repoFactory(UserSandboxEntity)

async function getOrCreate({ userId, platformId, aiConfig }: {
    userId: string
    platformId: string
    aiConfig: ChatAiConfig
}): Promise<string> {
    const existing = await userSandboxRepo().findOneBy({ userId })
    if (!isNil(existing)) {
        return existing.sandboxId
    }

    const sandboxId = await chatSandboxAgent.createSandbox({ aiConfig })

    const result = await userSandboxRepo()
        .createQueryBuilder()
        .insert()
        .values({
            id: apId(),
            userId,
            platformId,
            sandboxId,
            lastUsedAt: new Date().toISOString(),
        })
        .orIgnore()
        .execute()

    if (result.raw.length === 0 || result.identifiers.length === 0) {
        await chatSandboxAgent.destroySandbox({ sandboxId, aiConfig }).catch(() => undefined)
        const winner = await userSandboxRepo().findOneBy({ userId })
        if (isNil(winner)) {
            throw new Error('Failed to create or find user sandbox after race condition')
        }
        return winner.sandboxId
    }

    return sandboxId
}

async function getSandboxId({ userId }: { userId: string }): Promise<string | null> {
    const row = await userSandboxRepo().findOneBy({ userId })
    return row?.sandboxId ?? null
}

async function updateLastUsed({ userId }: { userId: string }): Promise<void> {
    await userSandboxRepo().update({ userId }, { lastUsedAt: new Date().toISOString() })
}

export const userSandboxService = {
    getOrCreate,
    getSandboxId,
    updateLastUsed,
}
