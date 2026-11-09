import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { catalogSnapshotStore, PIECE_CATALOG_SNAPSHOT_FLAG_ID } from '../../../../src/app/pieces/piece-catalog/catalog-snapshot-store'
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
    await databaseConnection().getRepository('flag').delete({ id: PIECE_CATALOG_SNAPSHOT_FLAG_ID })
})

describe('catalogSnapshotStore', () => {
    it('load returns null before any save', async () => {
        const loaded = await catalogSnapshotStore(mockLog).load()

        expect(loaded).toBeNull()
    })

    it('save then load round-trips 780 entries', async () => {
        const snapshot = buildSnapshot(780, '0.1.0')

        await catalogSnapshotStore(mockLog).save(snapshot)
        const loaded = await catalogSnapshotStore(mockLog).load()

        expect(loaded).toEqual(snapshot)
        expect(Object.keys(loaded ?? {}).length).toBe(780)
    })

    it('save overwrites the previous snapshot', async () => {
        const store = catalogSnapshotStore(mockLog)
        await store.save(buildSnapshot(780, '0.1.0'))
        const replacement = { 'piece-000': '0.2.0', 'piece-new': '1.0.0' }

        await store.save(replacement)
        const loaded = await store.load()

        expect(loaded).toEqual(replacement)
    })
})

function buildSnapshot(count: number, version: string): Record<string, string> {
    const snapshot: Record<string, string> = {}
    for (let i = 0; i < count; i++) {
        snapshot[`piece-${String(i).padStart(3, '0')}`] = version
    }
    return snapshot
}
