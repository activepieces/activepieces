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
