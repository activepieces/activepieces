import { apId } from '@activepieces/core-utils'
import { PackageType, PieceType, PrincipalType, SuggestionType, TriggerStrategy, TriggerTestStrategy } from '@activepieces/shared'
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
    describe('GET /v1/pieces (with filteredActionNames)', () => {
        it('returns all suggestedActions when filteredActionNames is empty', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup({
                platform: { filteredActionNames: {}, filteredTriggerNames: {} },
            })

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
                url: `/api/v1/pieces?suggestionType=${SuggestionType.ACTION}`,
                headers: { authorization: `Bearer ${token}` },
            })

            expect(response.statusCode).toBe(200)
            const pieces = response.json()
            const found = pieces.find((p: { name: string }) => p.name === 'test-piece')
            expect(found).toBeDefined()
            const actionNames = found.suggestedActions.map((a: { name: string }) => a.name)
            expect(actionNames).toContain('send_email')
            expect(actionNames).toContain('create_contact')
        })

        it('filters out suggestedActions listed in filteredActionNames for the matching piece', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup({
                platform: {
                    filteredActionNames: { 'test-piece': ['send_email'] },
                    filteredTriggerNames: {},
                },
            })

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
                url: `/api/v1/pieces?suggestionType=${SuggestionType.ACTION}`,
                headers: { authorization: `Bearer ${token}` },
            })

            expect(response.statusCode).toBe(200)
            const pieces = response.json()
            const found = pieces.find((p: { name: string }) => p.name === 'test-piece')
            expect(found).toBeDefined()
            const actionNames = found.suggestedActions.map((a: { name: string }) => a.name)
            expect(actionNames).not.toContain('send_email')
            expect(actionNames).toContain('create_contact')
        })

        it('does not filter actions on other pieces when filteredActionNames targets a specific piece', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup({
                platform: {
                    filteredActionNames: { 'piece-a': ['action_one'] },
                    filteredTriggerNames: {},
                },
            })

            const pieceA = createMockPieceMetadata({
                name: 'piece-a',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                actions: {
                    action_one: makeAction('action_one'),
                    action_two: makeAction('action_two'),
                },
                triggers: {},
            })
            const pieceB = createMockPieceMetadata({
                name: 'piece-b',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                actions: {
                    action_one: makeAction('action_one'),
                },
                triggers: {},
            })
            await db.save('piece_metadata', [pieceA, pieceB])
            await pieceCache(mockLog).setup()

            const token = await generateMockToken({
                type: PrincipalType.USER,
                platform: { id: mockPlatform.id },
            })

            const response = await app!.inject({
                method: 'GET',
                url: `/api/v1/pieces?suggestionType=${SuggestionType.ACTION}`,
                headers: { authorization: `Bearer ${token}` },
            })

            expect(response.statusCode).toBe(200)
            const pieces = response.json()

            const foundA = pieces.find((p: { name: string }) => p.name === 'piece-a')
            const foundB = pieces.find((p: { name: string }) => p.name === 'piece-b')
            expect(foundA.suggestedActions.map((a: { name: string }) => a.name)).not.toContain('action_one')
            expect(foundB.suggestedActions.map((a: { name: string }) => a.name)).toContain('action_one')
        })
    })

    describe('GET /v1/pieces (with piece sets)', () => {
        const emptyConfig = { disabledPieces: [], disabledActions: {}, disabledTriggers: {} }

        async function setupPieceSetScenario(disabledPieces: string[]) {
            const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                plan: { managePiecesEnabled: true },
                platform: { filteredPieceNames: [], filteredActionNames: {}, filteredTriggerNames: {} },
            })

            const pieceSet = {
                id: apId(),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                platformId: mockPlatform.id,
                name: 'Test Set',
                externalId: null,
                isDefault: false,
                includeNewPieces: true,
                generatedForProjectId: null,
                config: { disabledPieces, disabledActions: {}, disabledTriggers: {} },
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

        it('empty set (no disabled pieces) shows all platform-visible pieces', async () => {
            const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                plan: { managePiecesEnabled: true },
                platform: { filteredPieceNames: [], filteredActionNames: {}, filteredTriggerNames: {} },
            })

            const defaultSet = {
                id: apId(),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                platformId: mockPlatform.id,
                name: 'Default',
                externalId: null,
                isDefault: true,
                includeNewPieces: true,
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

        it('piece in disabledPieces is hidden', async () => {
            const { mockProject, token } = await setupPieceSetScenario(['hidden-piece'])

            const piece = createMockPieceMetadata({ name: 'hidden-piece', pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY, actions: {}, triggers: {} })
            await db.save('piece_metadata', piece)
            await pieceCache(mockLog).setup()

            const response = await app!.inject({ method: 'GET', url: `/api/v1/pieces?projectId=${mockProject.id}`, headers: { authorization: `Bearer ${token}` } })

            expect(response.statusCode).toBe(200)
            const pieces = response.json()
            expect(pieces.find((p: { name: string }) => p.name === 'hidden-piece')).toBeUndefined()
        })

        it('only the piece in disabledPieces is hidden; others remain visible', async () => {
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

        it('piece not in disabledPieces remains visible alongside a disabled one', async () => {
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

        it('platform-blocked piece stays hidden even when not in piece-set disabledPieces', async () => {
            const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                plan: { managePiecesEnabled: true },
                platform: { filteredPieceNames: ['platform-blocked'], filteredActionNames: {}, filteredTriggerNames: {}, filteredPieceBehavior: 'BLOCKED' },
            })

            const pieceSet = {
                id: apId(),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                platformId: mockPlatform.id,
                name: 'Permissive Set',
                externalId: null,
                isDefault: false,
                includeNewPieces: true,
                generatedForProjectId: null,
                config: emptyConfig,
            }
            await databaseConnection().getRepository('piece_set').save(pieceSet)
            await databaseConnection().getRepository('project').update({ id: mockProject.id }, { pieceSetId: pieceSet.id })

            const piece = createMockPieceMetadata({ name: 'platform-blocked', pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY, actions: {}, triggers: {} })
            await db.save('piece_metadata', piece)
            await pieceCache(mockLog).setup()

            const token = await generateMockToken({ type: PrincipalType.USER, id: mockOwner.id, platform: { id: mockPlatform.id } })
            const response = await app!.inject({ method: 'GET', url: `/api/v1/pieces?projectId=${mockProject.id}`, headers: { authorization: `Bearer ${token}` } })

            expect(response.statusCode).toBe(200)
            const pieces = response.json()
            expect(pieces.find((p: { name: string }) => p.name === 'platform-blocked')).toBeUndefined()
        })

        it('null pieceSetId falls back to default set (empty disabled list = all pieces visible)', async () => {
            const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                plan: { managePiecesEnabled: true },
                platform: { filteredPieceNames: [], filteredActionNames: {}, filteredTriggerNames: {} },
            })

            const defaultSet = {
                id: apId(),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                platformId: mockPlatform.id,
                name: 'Default',
                externalId: null,
                isDefault: true,
                includeNewPieces: true,
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
        const emptyConfig = { disabledPieces: [], disabledActions: {}, disabledTriggers: {} }

        async function setupComponentPieceSetScenario(opts: {
            disabledActions?: Record<string, string[]>
            disabledTriggers?: Record<string, string[]>
        }) {
            const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                plan: { managePiecesEnabled: true },
                platform: { filteredPieceNames: [], filteredActionNames: {}, filteredTriggerNames: {} },
            })

            const pieceSet = {
                id: apId(),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                platformId: mockPlatform.id,
                name: 'Component Test Set',
                externalId: null,
                isDefault: false,
                includeNewPieces: true,
                generatedForProjectId: null,
                config: {
                    disabledPieces: [],
                    disabledActions: opts.disabledActions ?? {},
                    disabledTriggers: opts.disabledTriggers ?? {},
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

        it('empty disabledActions shows all suggestedActions', async () => {
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

        it('action in disabledActions is hidden', async () => {
            const { mockProject, token } = await setupComponentPieceSetScenario({
                disabledActions: { 'my-piece': ['excluded_action'] },
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

        it('only actions listed in disabledActions are hidden; others remain visible', async () => {
            const { mockProject, token } = await setupComponentPieceSetScenario({
                disabledActions: { 'my-piece': ['blocked_action'] },
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

        it('platform-blocked action stays hidden even when not in piece-set disabledActions', async () => {
            const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                plan: { managePiecesEnabled: true },
                platform: {
                    filteredPieceNames: [],
                    filteredActionNames: { 'my-piece': ['platform_blocked_action'] },
                    filteredTriggerNames: {},
                },
            })

            const pieceSet = {
                id: apId(),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                platformId: mockPlatform.id,
                name: 'Permissive Set',
                externalId: null,
                isDefault: false,
                includeNewPieces: true,
                generatedForProjectId: null,
                config: emptyConfig,
            }
            await databaseConnection().getRepository('piece_set').save(pieceSet)
            await databaseConnection().getRepository('project').update({ id: mockProject.id }, { pieceSetId: pieceSet.id })

            const piece = createMockPieceMetadata({
                name: 'my-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                actions: { platform_blocked_action: makeAction('platform_blocked_action'), allowed_action: makeAction('allowed_action') },
                triggers: {},
            })
            await db.save('piece_metadata', piece)
            await pieceCache(mockLog).setup()

            const token = await generateMockToken({ type: PrincipalType.USER, id: mockOwner.id, platform: { id: mockPlatform.id } })
            const response = await app!.inject({
                method: 'GET',
                url: `/api/v1/pieces?projectId=${mockProject.id}&suggestionType=${SuggestionType.ACTION}`,
                headers: { authorization: `Bearer ${token}` },
            })

            expect(response.statusCode).toBe(200)
            const found = response.json().find((p: { name: string }) => p.name === 'my-piece')
            const actionNames = found.suggestedActions.map((a: { name: string }) => a.name)
            expect(actionNames).not.toContain('platform_blocked_action')
            expect(actionNames).toContain('allowed_action')
        })

        it('trigger in disabledTriggers is hidden; others remain visible', async () => {
            const { mockProject, token } = await setupComponentPieceSetScenario({
                disabledTriggers: { 'my-piece': ['blocked_trigger'] },
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

    describe('GET /v1/pieces (with filteredTriggerNames)', () => {
        it('filters out suggestedTriggers listed in filteredTriggerNames for the matching piece', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup({
                platform: {
                    filteredActionNames: {},
                    filteredTriggerNames: { 'test-piece': ['new_record'] },
                },
            })

            const piece = createMockPieceMetadata({
                name: 'test-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                actions: {},
                triggers: {
                    new_record: makeTrigger('new_record'),
                    updated_record: makeTrigger('updated_record'),
                },
            })
            await db.save('piece_metadata', piece)
            await pieceCache(mockLog).setup()

            const token = await generateMockToken({
                type: PrincipalType.USER,
                platform: { id: mockPlatform.id },
            })

            const response = await app!.inject({
                method: 'GET',
                url: `/api/v1/pieces?suggestionType=${SuggestionType.TRIGGER}`,
                headers: { authorization: `Bearer ${token}` },
            })

            expect(response.statusCode).toBe(200)
            const pieces = response.json()
            const found = pieces.find((p: { name: string }) => p.name === 'test-piece')
            expect(found).toBeDefined()
            const triggerNames = found.suggestedTriggers.map((t: { name: string }) => t.name)
            expect(triggerNames).not.toContain('new_record')
            expect(triggerNames).toContain('updated_record')
        })
    })
})
