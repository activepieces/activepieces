import { apId } from '@activepieces/core-utils'
import { EmbedSubdomainStatus, FlowRunStatus, FlowVersionState, PauseType, PrincipalType, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { domainHelper } from '../../../../src/app/helper/domain-helper'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowRun, createMockFlowVersion } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    ctx = await createTestContext(app, { plan: { embeddingEnabled: true } })
})

describe('Resume links on an embed subdomain', () => {
    it('gives a public resume url on the active subdomain that resumes the run', async () => {
        const hostname = await saveEmbedSubdomain({ status: EmbedSubdomainStatus.ACTIVE })
        const flowRunId = await saveFlowRun()

        const created = await createWaitpoint({ flowRunId, type: PauseType.WEBHOOK })

        expect(created.statusCode).toBe(StatusCodes.CREATED)
        const { id: waitpointId, resumeUrl, publicResumeUrl } = created.json()
        const publicUrl = new URL(publicResumeUrl)
        expect(publicUrl.origin).toBe(`https://${hostname}`)
        expect(new URL(resumeUrl).origin).toBe(await instanceOrigin())
        expect(publicUrl.pathname).toBe(new URL(resumeUrl).pathname)

        const page = await app.inject({
            method: 'GET',
            url: `${publicUrl.pathname}/confirm`,
            headers: { host: hostname, accept: 'text/html' },
        })
        expect(page.statusCode).toBe(StatusCodes.OK)
        expect(readFormActions(page.body)).toContain(`${publicUrl.pathname}/confirm?action=approve`)

        const approve = await app.inject({
            method: 'POST',
            url: `${publicUrl.pathname}/confirm?action=approve`,
            headers: { host: hostname, accept: 'application/json' },
            body: {},
        })
        expect(approve.statusCode).toBe(StatusCodes.OK)
        expect(approve.json().message).toBe('Your response has been recorded. You can close this page now.')
        expect(await databaseConnection().getRepository('waitpoint').findOneBy({ id: waitpointId })).toBeNull()
    })

    it('gives barrier confirm links on the active subdomain', async () => {
        const hostname = await saveEmbedSubdomain({ status: EmbedSubdomainStatus.ACTIVE })
        const flowRunId = await saveFlowRun()

        const created = await createWaitpoint({ flowRunId, type: PauseType.BARRIER, barrier: { signals: [{ label: 'Manager' }] } })

        expect(created.statusCode).toBe(StatusCodes.CREATED)
        const [signal] = created.json().barrier.signals
        expect(new URL(signal.confirmUrl).origin).toBe(`https://${hostname}`)
    })

    it('keeps the instance url while the subdomain is not active', async () => {
        await saveEmbedSubdomain({ status: EmbedSubdomainStatus.PENDING_VERIFICATION })
        const flowRunId = await saveFlowRun()

        const created = await createWaitpoint({ flowRunId, type: PauseType.WEBHOOK })

        expect(created.statusCode).toBe(StatusCodes.CREATED)
        const { resumeUrl, publicResumeUrl } = created.json()
        expect(publicResumeUrl).toBe(resumeUrl)
    })
})

async function saveEmbedSubdomain({ status }: { status: EmbedSubdomainStatus }): Promise<string> {
    const hostname = `embed-${apId().slice(0, 8).toLowerCase()}.example.com`
    await databaseConnection().getRepository('embed_subdomain').save({
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        platformId: ctx.platform.id,
        hostname,
        status,
        cloudflareId: `cf-${apId()}`,
        verificationRecords: [],
    })
    return hostname
}

async function saveFlowRun(): Promise<string> {
    const flow = createMockFlow({ projectId: ctx.project.id })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED })
    await db.save('flow_version', flowVersion)
    const flowRun = createMockFlowRun({
        projectId: ctx.project.id,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status: FlowRunStatus.PAUSED,
        environment: RunEnvironment.PRODUCTION,
    })
    await db.save('flow_run', flowRun)
    return flowRun.id
}

async function createWaitpoint({ flowRunId, type, barrier }: { flowRunId: string, type: PauseType, barrier?: Record<string, unknown> }): Promise<Awaited<ReturnType<FastifyInstance['inject']>>> {
    const engineToken = await generateMockToken({
        type: PrincipalType.ENGINE,
        id: apId(),
        projectId: ctx.project.id,
        platform: { id: ctx.platform.id },
    })
    return app.inject({
        method: 'POST',
        url: '/api/v1/waitpoints',
        headers: { authorization: `Bearer ${engineToken}` },
        body: { flowRunId, projectId: ctx.project.id, stepName: 'approval', type, version: 'V1', barrier },
    })
}

function readFormActions(html: string): string[] {
    return [...html.matchAll(/formaction="([^"]*)"/g)].map(([, encoded]) => encoded
        .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&amp;/g, '&'))
}

async function instanceOrigin(): Promise<string> {
    return new URL(await domainHelper.getPublicApiUrl({ path: '' })).origin
}
