import { apId } from '@activepieces/core-utils'
import { PackageType, PieceSelectionMode, PieceType, PrincipalType, SuggestionType, TriggerStrategy, TriggerTestStrategy } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { pieceCache } from '../../../../src/app/pieces/metadata/piece-cache'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    await databaseConnection().getRepository('piece_metadata').createQueryBuilder().delete().execute()
})

const makeAction = (name: string) => ({
    name,
    displayName: name,
    description: '',
    props: {},
    requireAuth: false,
})

const makeTrigger = (name: string) => ({
    name,
    displayName: name,
    description: '',
    props: {},
    type: TriggerStrategy.WEBHOOK,
    sampleData: {},
    testStrategy: TriggerTestStrategy.TEST_FUNCTION,
})

describe('Piece Component Filtering (EE)', () => {
    describe('GET /v1/pieces (with piece sets)', () => {
        const emptyConfig = { pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: [] }, selectedActions: {}, selectedTriggers: {} }

        async function setupPieceSetScenario(hiddenPieces: string[]) {
            const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                plan: { managePiecesEnabled: true },
            })

            const pieceSet = {
                id: apId(),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                platformId: mockPlatform.id,
                name: 'Test Set',
                externalId: null,
                isDefault: false,
                generatedForProjectId: null,
                config: { pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: hiddenPieces }, selectedActions: {}, selectedTriggers: {} },
            }
            await databaseConnection().getRepository('piece_set').save(pieceSet)
            await databaseConnection().getRepository('project').update({ id: mockProject.id }, { pieceSetId: pieceSet.id })

            const token = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            return { mockPlatform, mockProject, token }
        }

        it('empty set (no disabled pieces) shows all pieces', async () => {
            const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                plan: { managePiecesEnabled: true },
            })

            const defaultSet = {
                id: apId(),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                platformId: mockPlatform.id,
                name: 'Default',
                externalId: null,
                isDefault: true,
                generatedForProjectId: null,
                config: emptyConfig,
            }
            await databaseConnection().getRepository('piece_set').save(defaultSet)
            await databaseConnection().getRepository('project').update({ id: mockProject.id }, { pieceSetId: defaultSet.id })

            const piece = createMockPieceMetadata({ name: 'visible-piece', pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY, actions: {}, triggers: {} })
            await db.save('piece_metadata', piece)
            await pieceCache(mockLog).setup()

            const token = await generateMockToken({ type: PrincipalType.USER, id: mockOwner.id, platform: { id: mockPlatform.id } })
            const response = await app!.inject({ method: 'GET', url: `/api/v1/pieces?projectId=${mockProject.id}`, headers: { authorization: `Bearer ${token}` } })

            expect(response.statusCode).toBe(200)
            const pieces = response.json()
            expect(pieces.find((p: { name: string }) => p.name === 'visible-piece')).toBeDefined()
        })

        it('a hidden piece is not returned', async () => {
            const { mockProject, token } = await setupPieceSetScenario(['hidden-piece'])

            const piece = createMockPieceMetadata({ name: 'hidden-piece', pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY, actions: {}, triggers: {} })
            await db.save('piece_metadata', piece)
            await pieceCache(mockLog).setup()

            const response = await app!.inject({ method: 'GET', url: `/api/v1/pieces?projectId=${mockProject.id}`, headers: { authorization: `Bearer ${token}` } })

            expect(response.statusCode).toBe(200)
            const pieces = response.json()
            expect(pieces.find((p: { name: string }) => p.name === 'hidden-piece')).toBeUndefined()
        })

        it('only the hidden piece is excluded; others remain visible', async () => {
            const { mockProject, token } = await setupPieceSetScenario(['blocked-piece'])

            const allowed = createMockPieceMetadata({ name: 'allowed-piece', pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY, actions: {}, triggers: {} })
            const blocked = createMockPieceMetadata({ name: 'blocked-piece', pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY, actions: {}, triggers: {} })
            await db.save('piece_metadata', [allowed, blocked])
            await pieceCache(mockLog).setup()

            const response = await app!.inject({ method: 'GET', url: `/api/v1/pieces?projectId=${mockProject.id}`, headers: { authorization: `Bearer ${token}` } })

            expect(response.statusCode).toBe(200)
            const pieces = response.json()
            expect(pieces.find((p: { name: string }) => p.name === 'allowed-piece')).toBeDefined()
            expect(pieces.find((p: { name: string }) => p.name === 'blocked-piece')).toBeUndefined()
        })

        it('a visible piece remains alongside a hidden one', async () => {
            const { mockProject, token } = await setupPieceSetScenario(['excluded-piece'])

            const excluded = createMockPieceMetadata({ name: 'excluded-piece', pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY, actions: {}, triggers: {} })
            const visible = createMockPieceMetadata({ name: 'visible-piece-2', pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY, actions: {}, triggers: {} })
            await db.save('piece_metadata', [excluded, visible])
            await pieceCache(mockLog).setup()

            const response = await app!.inject({ method: 'GET', url: `/api/v1/pieces?projectId=${mockProject.id}`, headers: { authorization: `Bearer ${token}` } })

            expect(response.statusCode).toBe(200)
            const pieces = response.json()
            expect(pieces.find((p: { name: string }) => p.name === 'excluded-piece')).toBeUndefined()
            expect(pieces.find((p: { name: string }) => p.name === 'visible-piece-2')).toBeDefined()
        })

        it('null pieceSetId falls back to default set (empty disabled list = all pieces visible)', async () => {
            const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                plan: { managePiecesEnabled: true },
            })

            const defaultSet = {
                id: apId(),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                platformId: mockPlatform.id,
                name: 'Default',
                externalId: null,
                isDefault: true,
                generatedForProjectId: null,
                config: emptyConfig,
            }
            await databaseConnection().getRepository('piece_set').save(defaultSet)

            const piece = createMockPieceMetadata({ name: 'fallback-piece', pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY, actions: {}, triggers: {} })
            await db.save('piece_metadata', piece)
            await pieceCache(mockLog).setup()

            const token = await generateMockToken({ type: PrincipalType.USER, id: mockOwner.id, platform: { id: mockPlatform.id } })
            const response = await app!.inject({ method: 'GET', url: `/api/v1/pieces?projectId=${mockProject.id}`, headers: { authorization: `Bearer ${token}` } })

            expect(response.statusCode).toBe(200)
            const pieces = response.json()
            expect(pieces.find((p: { name: string }) => p.name === 'fallback-piece')).toBeDefined()
        })
    })

    describe('GET /v1/pieces (component filters via piece sets)', () => {
        async function setupComponentPieceSetScenario(opts: {
            selectedActions?: Record<string, string[]>
            selectedTriggers?: Record<string, string[]>
        }) {
            const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                plan: { managePiecesEnabled: true },
            })

            const pieceSet = {
                id: apId(),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                platformId: mockPlatform.id,
                name: 'Component Test Set',
                externalId: null,
                isDefault: false,
                generatedForProjectId: null,
                config: {
                    pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: [] },
                    selectedActions: opts.selectedActions ?? {},
                    selectedTriggers: opts.selectedTriggers ?? {},
                },
            }
            await databaseConnection().getRepository('piece_set').save(pieceSet)
            await databaseConnection().getRepository('project').update({ id: mockProject.id }, { pieceSetId: pieceSet.id })

            const token = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            return { mockPlatform, mockProject, token }
        }

        it('no selected list shows all suggestedActions', async () => {
            const { mockProject, token } = await setupComponentPieceSetScenario({})

            const piece = createMockPieceMetadata({
                name: 'my-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                actions: { action_a: makeAction('action_a'), action_b: makeAction('action_b') },
                triggers: {},
            })
            await db.save('piece_metadata', piece)
            await pieceCache(mockLog).setup()

            const response = await app!.inject({
                method: 'GET',
                url: `/api/v1/pieces?projectId=${mockProject.id}&suggestionType=${SuggestionType.ACTION}`,
                headers: { authorization: `Bearer ${token}` },
            })

            expect(response.statusCode).toBe(200)
            const found = response.json().find((p: { name: string }) => p.name === 'my-piece')
            expect(found).toBeDefined()
            const actionNames = found.suggestedActions.map((a: { name: string }) => a.name)
            expect(actionNames).toContain('action_a')
            expect(actionNames).toContain('action_b')
        })

        it('action not in the selected list is hidden', async () => {
            const { mockProject, token } = await setupComponentPieceSetScenario({
                selectedActions: { 'my-piece': ['visible_action'] },
            })

            const piece = createMockPieceMetadata({
                name: 'my-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                actions: { excluded_action: makeAction('excluded_action'), visible_action: makeAction('visible_action') },
                triggers: {},
            })
            await db.save('piece_metadata', piece)
            await pieceCache(mockLog).setup()

            const response = await app!.inject({
                method: 'GET',
                url: `/api/v1/pieces?projectId=${mockProject.id}&suggestionType=${SuggestionType.ACTION}`,
                headers: { authorization: `Bearer ${token}` },
            })

            expect(response.statusCode).toBe(200)
            const found = response.json().find((p: { name: string }) => p.name === 'my-piece')
            const actionNames = found.suggestedActions.map((a: { name: string }) => a.name)
            expect(actionNames).not.toContain('excluded_action')
            expect(actionNames).toContain('visible_action')
        })

        it('only actions in the selected list are visible; others are hidden', async () => {
            const { mockProject, token } = await setupComponentPieceSetScenario({
                selectedActions: { 'my-piece': ['allowed_action'] },
            })

            const piece = createMockPieceMetadata({
                name: 'my-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                actions: { allowed_action: makeAction('allowed_action'), blocked_action: makeAction('blocked_action') },
                triggers: {},
            })
            await db.save('piece_metadata', piece)
            await pieceCache(mockLog).setup()

            const response = await app!.inject({
                method: 'GET',
                url: `/api/v1/pieces?projectId=${mockProject.id}&suggestionType=${SuggestionType.ACTION}`,
                headers: { authorization: `Bearer ${token}` },
            })

            expect(response.statusCode).toBe(200)
            const found = response.json().find((p: { name: string }) => p.name === 'my-piece')
            const actionNames = found.suggestedActions.map((a: { name: string }) => a.name)
            expect(actionNames).toContain('allowed_action')
            expect(actionNames).not.toContain('blocked_action')
        })

        it('trigger not in the selected list is hidden; others remain visible', async () => {
            const { mockProject, token } = await setupComponentPieceSetScenario({
                selectedTriggers: { 'my-piece': ['allowed_trigger'] },
            })

            const piece = createMockPieceMetadata({
                name: 'my-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                actions: {},
                triggers: {
                    allowed_trigger: makeTrigger('allowed_trigger'),
                    blocked_trigger: makeTrigger('blocked_trigger'),
                },
            })
            await db.save('piece_metadata', piece)
            await pieceCache(mockLog).setup()

            const response = await app!.inject({
                method: 'GET',
                url: `/api/v1/pieces?projectId=${mockProject.id}&suggestionType=${SuggestionType.TRIGGER}`,
                headers: { authorization: `Bearer ${token}` },
            })

            expect(response.statusCode).toBe(200)
            const found = response.json().find((p: { name: string }) => p.name === 'my-piece')
            expect(found).toBeDefined()
            const triggerNames = found.suggestedTriggers.map((t: { name: string }) => t.name)
            expect(triggerNames).toContain('allowed_trigger')
            expect(triggerNames).not.toContain('blocked_trigger')
        })
    })

    describe('GET /v1/pieces/:name (component filters on the detail endpoint)', () => {
        it('applies the project piece-set component selection when projectId is passed', async () => {
            const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                plan: { managePiecesEnabled: true },
            })

            const pieceSet = {
                id: apId(),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                platformId: mockPlatform.id,
                name: 'Detail Test Set',
                externalId: null,
                isDefault: false,
                generatedForProjectId: null,
                config: {
                    pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: [] },
                    selectedActions: { 'test-piece': ['visible_action'] },
                    selectedTriggers: {},
                },
            }
            await databaseConnection().getRepository('piece_set').save(pieceSet)
            await databaseConnection().getRepository('project').update({ id: mockProject.id }, { pieceSetId: pieceSet.id })

            const piece = createMockPieceMetadata({
                name: 'test-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                actions: {
                    visible_action: makeAction('visible_action'),
                    hidden_action: makeAction('hidden_action'),
                },
                triggers: {},
            })
            await db.save('piece_metadata', piece)
            await pieceCache(mockLog).setup()

            const token = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app!.inject({
                method: 'GET',
                url: `/api/v1/pieces/test-piece?projectId=${mockProject.id}`,
                headers: { authorization: `Bearer ${token}` },
            })

            expect(response.statusCode).toBe(200)
            expect(Object.keys(response.json().actions)).toEqual(['visible_action'])
        })

        it('returns all components when nothing is filtered', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const piece = createMockPieceMetadata({
                name: 'test-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                actions: {
                    send_email: makeAction('send_email'),
                    create_contact: makeAction('create_contact'),
                },
                triggers: {},
            })
            await db.save('piece_metadata', piece)
            await pieceCache(mockLog).setup()

            const token = await generateMockToken({
                type: PrincipalType.USER,
                platform: { id: mockPlatform.id },
            })

            const response = await app!.inject({
                method: 'GET',
                url: '/api/v1/pieces/test-piece',
                headers: { authorization: `Bearer ${token}` },
            })

            expect(response.statusCode).toBe(200)
            expect(Object.keys(response.json().actions).sort()).toEqual(['create_contact', 'send_email'])
        })
    })
})
