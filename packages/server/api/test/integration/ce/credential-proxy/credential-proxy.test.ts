import { apId } from '@activepieces/core-utils'
import { PieceAuth, Property } from '@activepieces/pieces-framework'
import { AppConnectionType, credentialPlaceholder, PackageType, PieceType, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { encryptUtils } from '../../../../src/app/helper/encryption'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockConnection, createMockPieceMetadata } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const PROXY_SECRET = 'credential-proxy-integration-secret'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
    process.env['AP_CREDENTIAL_PROXY_SECRET'] = PROXY_SECRET
})

afterAll(async () => {
    delete process.env['AP_CREDENTIAL_PROXY_SECRET']
    await teardownTestEnvironment()
})

describe('Credential proxy', () => {
    describe('GET /v1/worker/app-connections/:externalId', () => {
        it('returns the raw value when the proxy is not configured', async () => {
            delete process.env['AP_CREDENTIAL_PROXY_SECRET']
            const ctx = await createTestContext(app)
            const externalId = await saveSecretTextConnection({ ctx, secret: 'plain-secret' })

            const response = await fetchAsEngine({ ctx, externalId })

            process.env['AP_CREDENTIAL_PROXY_SECRET'] = PROXY_SECRET
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().value.secret_text).toBe('plain-secret')
        })

        it('replaces the secret with a placeholder that the proxy can resolve', async () => {
            const ctx = await createTestContext(app)
            const externalId = await saveSecretTextConnection({ ctx, secret: 'real-secret' })

            const response = await fetchAsEngine({ ctx, externalId })

            expect(response.statusCode).toBe(StatusCodes.OK)
            const placeholder: string = response.json().value.secret_text
            const [ref] = credentialPlaceholder.parse(placeholder)
            expect(ref.placeholder).toBe(placeholder)

            const resolved = await resolveAsProxy({ grantId: ref.grantId })
            expect(resolved.statusCode).toBe(StatusCodes.OK)
            expect(resolved.json()).toMatchObject({
                grantId: ref.grantId,
                fields: [{ index: ref.fieldIndex, value: 'real-secret' }],
                allowedHosts: [],
                allowAnyHost: true,
            })
        })

        it('reuses the grant for the same job and mints a new one for another job', async () => {
            const ctx = await createTestContext(app)
            const externalId = await saveSecretTextConnection({ ctx, secret: 's' })
            const jobId = apId()

            const first = await fetchAsEngine({ ctx, externalId, jobId })
            const second = await fetchAsEngine({ ctx, externalId, jobId })
            const otherJob = await fetchAsEngine({ ctx, externalId, jobId: apId() })

            expect(first.json().value.secret_text).toBe(second.json().value.secret_text)
            expect(otherJob.json().value.secret_text).not.toBe(first.json().value.secret_text)
        })

        it('keeps the basic-auth username and placeholders only the password', async () => {
            const ctx = await createTestContext(app)
            const connection = createMockConnection({ platformId: ctx.platform.id, projectIds: [ctx.project.id] }, ctx.user.id)
            await db.save('app_connection', {
                ...connection,
                type: AppConnectionType.BASIC_AUTH,
                value: await encryptUtils.encryptObject({ type: AppConnectionType.BASIC_AUTH, username: 'alice', password: 'hunter2' }),
            })

            const response = await fetchAsEngine({ ctx, externalId: connection.externalId })

            const value = response.json().value
            expect(value.username).toBe('alice')
            expect(credentialPlaceholder.containsAny(value.password)).toBe(true)
            const [ref] = credentialPlaceholder.parse(value.password)
            const resolved = await resolveAsProxy({ grantId: ref.grantId })
            expect(resolved.json().fields).toEqual([{ index: 0, value: 'hunter2' }])
        })

        it('trusts the piece auth declaration for custom auth, applies the name heuristic to undeclared props, and derives allowed hosts from URL props', async () => {
            const ctx = await createTestContext(app)
            const piece = createMockPieceMetadata({
                platformId: ctx.platform.id,
                packageType: PackageType.REGISTRY,
                pieceType: PieceType.OFFICIAL,
                auth: PieceAuth.CustomAuth({
                    required: true,
                    props: {
                        base_url: Property.ShortText({ displayName: 'Base URL', required: true }),
                        signing_secret: PieceAuth.SecretText({ displayName: 'Signing secret', required: true }),
                        api_key: Property.ShortText({ displayName: 'API key', required: true }),
                        workspace: Property.ShortText({ displayName: 'Workspace', required: true }),
                    },
                }),
            })
            await db.save('piece_metadata', piece)
            const connection = createMockConnection({
                platformId: ctx.platform.id,
                projectIds: [ctx.project.id],
                pieceName: piece.name,
                pieceVersion: piece.version,
            }, ctx.user.id)
            await db.save('app_connection', {
                ...connection,
                type: AppConnectionType.CUSTOM_AUTH,
                value: await encryptUtils.encryptObject({
                    type: AppConnectionType.CUSTOM_AUTH,
                    props: { base_url: 'https://acme.example.com/api', signing_secret: 'shh', api_key: 'k-1', workspace: 'acme', legacy_token: 'old' },
                }),
            })

            const response = await fetchAsEngine({ ctx, externalId: connection.externalId })

            const props = response.json().value.props
            expect(props.base_url).toBe('https://acme.example.com/api')
            expect(props.workspace).toBe('acme')
            expect(props.api_key).toBe('k-1')
            expect(credentialPlaceholder.containsAny(props.signing_secret)).toBe(true)
            expect(credentialPlaceholder.containsAny(props.legacy_token)).toBe(true)
            const [ref] = credentialPlaceholder.parse(props.signing_secret)
            const resolved = await resolveAsProxy({ grantId: ref.grantId })
            expect(resolved.json()).toMatchObject({
                pieceName: piece.name,
                allowedHosts: ['acme.example.com'],
                allowAnyHost: false,
            })
            expect(resolved.json().fields).toEqual(expect.arrayContaining([
                { index: 0, value: 'shh' },
                { index: 1, value: 'old' },
            ]))
        })
    })

    describe('GET /v1/worker/variables/:name', () => {
        it('replaces a secret variable with a placeholder the proxy resolves to the value', async () => {
            const ctx = await createTestContext(app)
            const created = await ctx.post('/v1/variables', { projectId: ctx.project.id, name: 'api_token', value: 'variable-secret' })
            expect(created.statusCode).toBe(StatusCodes.CREATED)
            const engineToken = await engineTokenFor({ ctx })

            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/worker/variables/api_token',
                headers: { authorization: `Bearer ${engineToken}` },
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            const [ref] = credentialPlaceholder.parse(response.json().value)
            expect(ref).toBeDefined()
            const resolved = await resolveAsProxy({ grantId: ref.grantId })
            expect(resolved.json()).toMatchObject({ fields: [{ index: 0, value: 'variable-secret' }], allowAnyHost: true })
        })
    })

    describe('POST /v1/credential-proxy/grants/resolve', () => {
        it('rejects a wrong proxy secret', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/credential-proxy/grants/resolve',
                headers: { authorization: 'Bearer apcp_not-the-secret' },
                body: { grantId: apId() },
            })
            expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED)
        })

        it('rejects engine and user tokens', async () => {
            const ctx = await createTestContext(app)
            const engineToken = await engineTokenFor({ ctx })

            const asEngine = await app.inject({
                method: 'POST',
                url: '/api/v1/credential-proxy/grants/resolve',
                headers: { authorization: `Bearer ${engineToken}` },
                body: { grantId: apId() },
            })
            const asUser = await ctx.post('/v1/credential-proxy/grants/resolve', { grantId: apId() })

            expect(asEngine.statusCode).toBe(StatusCodes.FORBIDDEN)
            expect(asUser.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('rejects a JWT forged with the credential proxy principal type', async () => {
            const forged = await generateMockToken({ id: apId(), type: PrincipalType.CREDENTIAL_PROXY })

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/credential-proxy/grants/resolve',
                headers: { authorization: `Bearer ${forged}` },
                body: { grantId: apId() },
            })

            expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED)
        })

        it('returns 404 for an unknown grant', async () => {
            const response = await resolveAsProxy({ grantId: apId() })
            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })
})

async function saveSecretTextConnection({ ctx, secret }: { ctx: TestContext, secret: string }): Promise<string> {
    const connection = createMockConnection({ platformId: ctx.platform.id, projectIds: [ctx.project.id] }, ctx.user.id)
    await db.save('app_connection', {
        ...connection,
        value: await encryptUtils.encryptObject({ type: AppConnectionType.SECRET_TEXT, secret_text: secret }),
    })
    return connection.externalId
}

async function engineTokenFor({ ctx, jobId }: { ctx: TestContext, jobId?: string }): Promise<string> {
    return generateMockToken({
        type: PrincipalType.ENGINE,
        id: jobId ?? apId(),
        projectId: ctx.project.id,
        platform: { id: ctx.platform.id },
    })
}

async function fetchAsEngine({ ctx, externalId, jobId }: { ctx: TestContext, externalId: string, jobId?: string }): Promise<Awaited<ReturnType<FastifyInstance['inject']>>> {
    return app.inject({
        method: 'GET',
        url: `/api/v1/worker/app-connections/${externalId}`,
        headers: { authorization: `Bearer ${await engineTokenFor({ ctx, jobId })}` },
    })
}

async function resolveAsProxy({ grantId }: { grantId: string }): Promise<Awaited<ReturnType<FastifyInstance['inject']>>> {
    return app.inject({
        method: 'POST',
        url: '/api/v1/credential-proxy/grants/resolve',
        headers: { authorization: `Bearer apcp_${PROXY_SECRET}` },
        body: { grantId },
    })
}
