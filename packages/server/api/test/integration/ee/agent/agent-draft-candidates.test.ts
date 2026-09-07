import { AppConnectionStatus, PackageType, PieceType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { agentDraftAi } from '../../../../src/app/ee/agent/agent-draft-ai'
import { db } from '../../../helpers/db'
import { createMockConnection, createMockPieceMetadata } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const APPS = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet']

beforeAll(async () => {
    app = await setupTestEnvironment()
    for (const name of APPS) {
        await db.save('piece_metadata', createMockPieceMetadata({
            name: `@activepieces/piece-${name}`,
            displayName: name,
            version: '1.0.0',
            pieceType: PieceType.OFFICIAL,
            packageType: PackageType.REGISTRY,
            platformId: undefined,
            actions: {
                read_it: { name: 'read_it', displayName: 'Read', description: 'Read', requireAuth: true, props: {} },
                write_it: { name: 'write_it', displayName: 'Write', description: 'Write', requireAuth: true, props: {} },
            },
        }))
    }
})

afterAll(async () => {
    await teardownTestEnvironment()
})

// createMockConnection pins status to ACTIVE whatever it is passed, so a broken one is set after.
async function connect(ctx: TestContext, app_: string, status: AppConnectionStatus, count = 1): Promise<void> {
    for (let index = 0; index < count; index++) {
        const connection = createMockConnection({
            projectIds: [ctx.project.id],
            platformId: ctx.platform.id,
            pieceName: `@activepieces/piece-${app_}`,
        }, ctx.user.id)
        await db.save('app_connection', connection)
        if (status !== AppConnectionStatus.ACTIVE) {
            await db.update('app_connection', connection.id, { status })
        }
    }
}

async function offeredApps(ctx: TestContext): Promise<string[]> {
    const candidates = await agentDraftAi(app.log).candidatesForProject({ projectId: ctx.project.id, platformId: ctx.platform.id })
    return candidates.map((candidate) => candidate.pieceName.replace('@activepieces/piece-', '')).sort()
}

describe('which apps a draft may suggest tools from', () => {
    it('offers an app the project has a working connection for', async () => {
        const ctx = await createTestContext(app)
        await connect(ctx, 'alpha', AppConnectionStatus.ACTIVE)

        expect(await offeredApps(ctx)).toEqual(['alpha'])
    })

    // A tool bound to a broken account reads as ready on the card and fails on first use, which is
    // the whole reason suggestions are bounded to what is connected.
    it('never offers an app whose only connection is broken', async () => {
        const ctx = await createTestContext(app)
        await connect(ctx, 'alpha', AppConnectionStatus.ERROR)
        await connect(ctx, 'bravo', AppConnectionStatus.MISSING)
        await connect(ctx, 'charlie', AppConnectionStatus.ACTIVE)

        expect(await offeredApps(ctx)).toEqual(['charlie'])
    })

    it('offers an app with a broken account alongside a working one', async () => {
        const ctx = await createTestContext(app)
        await connect(ctx, 'alpha', AppConnectionStatus.ERROR)
        await connect(ctx, 'alpha', AppConnectionStatus.ACTIVE)

        expect(await offeredApps(ctx)).toEqual(['alpha'])
    })

    // Counting connection rows let a few apps with many accounts each fill a budget meant for apps.
    it('counts apps, not accounts, when many accounts belong to few apps', async () => {
        const ctx = await createTestContext(app)
        for (const name of APPS) {
            await connect(ctx, name, AppConnectionStatus.ACTIVE, 12)
        }

        expect(await offeredApps(ctx)).toEqual(['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel'])
    })

    it('offers nothing when the project has connected nothing', async () => {
        const ctx = await createTestContext(app)

        expect(await offeredApps(ctx)).toEqual([])
    })
})
